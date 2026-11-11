"""评论模型：两级结构（评论 + 回复），不做无限嵌套。

理由：钓点评论的核心是「问一句、答一句」，两级足够表达；
层级再深会让前端渲染和分页都变复杂，收益很低。
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.user import User


class Comment(Base):
    __tablename__ = "wf_comment"
    __table_args__ = (
        Index("ix_wf_comment_spot_created", "spot_id", "created_at"),
        {"comment": "点位评论"},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    spot_id: Mapped[int] = mapped_column(
        ForeignKey("wf_spot.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("wf_user.id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("wf_comment.id", ondelete="CASCADE"), nullable=True, comment="回复的父评论"
    )
    content: Mapped[str] = mapped_column(String(500), nullable=False, comment="评论内容")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    user: Mapped[User] = relationship(lazy="joined")
