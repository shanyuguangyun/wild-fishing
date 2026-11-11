"""城市模型。

城市是内容归属与定位的基础：点位按城市聚合，用户定位后取最近的城市。
内置常用城市及经纬度，`is_hot` 用于城市选择器首屏展示。
"""

from decimal import Decimal

from sqlalchemy import Boolean, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class City(Base):
    __tablename__ = "wf_city"
    __table_args__ = (
        UniqueConstraint("name", "province", name="uq_wf_city_name_province"),
        {"comment": "城市（含经纬度，用于定位匹配与距离排序）"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(32), nullable=False, index=True, comment="城市名")
    province: Mapped[str] = mapped_column(String(32), nullable=False, comment="省 / 直辖市")
    pinyin: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="拼音，支持搜索")
    lat: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False, comment="纬度")
    lng: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False, comment="经度")
    is_hot: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, comment="是否热门城市（选择器首屏）"
    )
