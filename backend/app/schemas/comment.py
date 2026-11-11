"""评论与评分结构。"""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.spot import AuthorOut


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=500)
    parent_id: int | None = None


class CommentOut(BaseModel):
    id: int
    content: str
    created_at: datetime
    parent_id: int | None
    user: AuthorOut
    is_mine: bool = False


class RatingIn(BaseModel):
    score: float = Field(ge=1, le=5, description="1-5 星，允许 0.5 步进")


class RatingResult(BaseModel):
    rating_avg: float
    rating_count: int
    my_rating: float
