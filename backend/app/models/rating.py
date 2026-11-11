"""评分模型：一个用户对一个点位只有一条评分，可修改。

唯一约束是「一人一评」的唯一可靠实现——并发下重复提交也只会更新，不会多算一次。
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, SmallInteger, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.user import User


class Rating(Base):
    __tablename__ = "wf_rating"
    __table_args__ = (
        UniqueConstraint("spot_id", "user_id", name="uq_wf_rating_spot_user"),
        {"comment": "点位评分（1-5 星，一人一条）"},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    spot_id: Mapped[int] = mapped_column(
        ForeignKey("wf_spot.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("wf_user.id", ondelete="CASCADE"), nullable=False
    )
    score: Mapped[Decimal] = mapped_column(Numeric(2, 1), nullable=False, comment="1.0 - 5.0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    user: Mapped[User] = relationship(lazy="joined")
