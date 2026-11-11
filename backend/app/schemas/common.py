"""通用响应结构。"""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """统一分页结构：前端只需要关心 items / has_more。"""

    items: list[T]
    total: int = Field(description="符合条件的总条数")
    page: int
    size: int
    has_more: bool


class Message(BaseModel):
    """简单的操作结果，例如「已标记」。"""

    message: str
