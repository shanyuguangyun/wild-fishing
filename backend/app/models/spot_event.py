"""点位互动事件：用于计算「近期热度」。

为什么单独建事件表，而不是在点位上加一个 heat 字段：
热度是「近 7 天」的滑动窗口，静态字段需要定时任务做衰减，容易和真实数据脱节；
把每次浏览 / 评论 / 打分记成事件，热度就是一次带时间条件的求和，数据永远自洽。
表很小（只存必要字段），加索引即可支撑排序。
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SpotEvent(Base):
    __tablename__ = "wf_spot_event"
    __table_args__ = (
        Index("ix_wf_spot_event_spot_created", "spot_id", "created_at"),
        Index("ix_wf_spot_event_created", "created_at"),
        {"comment": "点位互动事件（浏览 / 评论 / 评分），按时间窗口聚合出热度"},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    spot_id: Mapped[int] = mapped_column(
        ForeignKey("wf_spot.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("wf_user.id", ondelete="SET NULL"), nullable=True, comment="匿名浏览为空"
    )
    event_type: Mapped[str] = mapped_column(String(16), nullable=False, comment="见 enums.SpotEventType")
    weight: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=1, comment="热度权重：浏览 1 / 评论 3 / 评分 2"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
