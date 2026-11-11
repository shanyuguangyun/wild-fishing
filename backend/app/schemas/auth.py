"""账号相关请求 / 响应结构。"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterIn(BaseModel):
    email: EmailStr
    nickname: str = Field(min_length=1, max_length=20, description="昵称")
    password: str = Field(min_length=6, max_length=64, description="密码，至少 6 位")


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=64)


class UserOut(BaseModel):
    """对外暴露的用户信息：绝不包含 password_hash。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    nickname: str
    avatar_url: str | None = None
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
