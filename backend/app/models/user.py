"""用户模型。"""

from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "wf_user"
    __table_args__ = {"comment": "用户"}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False, index=True, comment="登录邮箱"
    )
    nickname: Mapped[str] = mapped_column(String(32), nullable=False, comment="昵称")
    password_hash: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="bcrypt 哈希，绝不出现在接口响应中"
    )
    avatar_url: Mapped[str | None] = mapped_column(
        String(255), nullable=True, comment="头像地址，暂未开放上传"
    )
