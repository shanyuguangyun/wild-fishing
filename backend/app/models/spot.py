"""点位（钓点文章）模型。

一个点位 = 一篇图文分享：位置、水域、鱼种、收费方式 + 正文与图片。
统计字段（浏览 / 评论 / 评分）冗余在表上，避免列表页做多次聚合查询；
写入侧在同一事务内维护，读多写少的场景这样最划算。
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.city import City
from app.models.user import User


class Spot(Base):
    __tablename__ = "wf_spot"
    __table_args__ = (
        # 列表页固定按城市过滤，再按时间 / 评分排序，这两个联合索引覆盖主要查询
        Index("ix_wf_spot_city_created", "city_id", "created_at"),
        Index("ix_wf_spot_city_rating", "city_id", "rating_avg"),
        {"comment": "钓鱼点位（用户发布的图文）"},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    city_id: Mapped[int] = mapped_column(
        ForeignKey("wf_city.id", ondelete="RESTRICT"), nullable=False, comment="所属城市"
    )
    author_id: Mapped[int] = mapped_column(
        ForeignKey("wf_user.id", ondelete="CASCADE"), nullable=False, comment="发布者"
    )

    title: Mapped[str] = mapped_column(String(120), nullable=False, comment="标题")
    summary: Mapped[str] = mapped_column(String(255), nullable=False, default="", comment="摘要，列表页展示")
    content: Mapped[str] = mapped_column(Text, nullable=False, comment="正文（纯文本，前端按段落渲染）")
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="封面图")

    location_name: Mapped[str] = mapped_column(String(120), nullable=False, comment="钓点名称")
    address: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="详细位置")
    lat: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False, comment="纬度")
    lng: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False, comment="经度")

    water_type: Mapped[str] = mapped_column(String(16), nullable=False, comment="水域类型，见 enums.WaterType")
    fee_type: Mapped[str] = mapped_column(String(16), nullable=False, default="free", comment="收费方式")
    fish_types: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list, comment="目标鱼种")

    # --- 冗余统计 -------------------------------------------------------
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="累计浏览")
    comment_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="评论数")
    rating_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="评分人数")
    rating_sum: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="评分总分")
    rating_avg: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), nullable=False, default=Decimal("0.00"), comment="平均分，冗余用于排序"
    )

    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否展示")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="发布时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now(), comment="更新时间"
    )

    city: Mapped[City] = relationship(lazy="joined")
    author: Mapped[User] = relationship(lazy="joined")
    images: Mapped[list["SpotImage"]] = relationship(
        back_populates="spot",
        cascade="all, delete-orphan",
        order_by="SpotImage.sort_order",
        lazy="selectin",
    )


class SpotImage(Base):
    """点位配图，与正文分表存储，方便一篇文章放多张图。"""

    __tablename__ = "wf_spot_image"
    __table_args__ = {"comment": "点位配图"}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    spot_id: Mapped[int] = mapped_column(
        ForeignKey("wf_spot.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False, comment="图片地址")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="展示顺序")

    spot: Mapped[Spot] = relationship(back_populates="images")
