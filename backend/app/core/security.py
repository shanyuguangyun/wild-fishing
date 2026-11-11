"""密码哈希与 JWT 签发 / 校验。"""

from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from app.core.config import settings


def hash_password(raw_password: str) -> str:
    """bcrypt 自带随机盐，同一密码每次结果都不同，这是正确行为。"""
    return bcrypt.hashpw(raw_password.encode(), bcrypt.gensalt()).decode()


def verify_password(raw_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(raw_password.encode(), password_hash.encode())
    except ValueError:
        # 数据库里的哈希格式异常时按验证失败处理，不要抛 500
        return False


def create_access_token(subject: str | int, expires_minutes: int | None = None) -> str:
    """签发 JWT，sub 放用户 id。"""
    expire = datetime.now(UTC) + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    payload: dict[str, Any] = {"sub": str(subject), "exp": expire, "iat": datetime.now(UTC)}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int | None:
    """解析 JWT，失败（过期 / 篡改）返回 None，由调用方决定回 401。"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError, TypeError):
        return None
