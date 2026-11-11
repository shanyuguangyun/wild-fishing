"""API 依赖：数据库会话、当前用户、可选用户。

登录态用 `Authorization: Bearer <token>`；`get_current_user` 强制登录，
`get_optional_user` 用于「登录了就能看到自己的评分，没登录也能看列表」的接口。
"""

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

DbSession = Annotated[Session, Depends(get_db)]


def _user_from_header(db: Session, authorization: str | None) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    user_id = decode_access_token(authorization.split(" ", 1)[1].strip())
    if user_id is None:
        return None
    return db.get(User, user_id)


def get_optional_user(
    db: DbSession, authorization: Annotated[str | None, Header()] = None
) -> User | None:
    return _user_from_header(db, authorization)


def get_current_user(
    db: DbSession, authorization: Annotated[str | None, Header()] = None
) -> User:
    user = _user_from_header(db, authorization)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="请先登录",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
