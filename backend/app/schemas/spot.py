"""点位相关结构。"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import FeeType, WaterType


class AuthorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nickname: str
    avatar_url: str | None = None


class CityBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class SpotCreate(BaseModel):
    """发布点位。经纬度必填：距离排序和地图都依赖它。"""

    title: str = Field(min_length=4, max_length=120)
    summary: str = Field(default="", max_length=255)
    content: str = Field(min_length=10, max_length=20000)
    cover_url: str | None = Field(default=None, max_length=500)
    city_id: int
    location_name: str = Field(min_length=1, max_length=120)
    address: str | None = Field(default=None, max_length=255)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    water_type: WaterType
    fee_type: FeeType = FeeType.FREE
    fish_types: list[str] = Field(default_factory=list, max_length=5)
    images: list[str] = Field(default_factory=list, max_length=9)

    @field_validator("fish_types", "images")
    @classmethod
    def dedupe(cls, value: list[str]) -> list[str]:
        """去重并丢掉空串，避免前端误传导致脏数据。"""
        seen: list[str] = []
        for item in value:
            item = item.strip()
            if item and item not in seen:
                seen.append(item)
        return seen


class SpotListItem(BaseModel):
    """列表卡片：只包含卡片需要展示的字段。"""

    id: int
    title: str
    summary: str
    cover_url: str | None
    location_name: str
    water_type: str
    water_type_label: str
    fee_type: str
    fee_type_label: str
    fish_types: list[str]
    rating_avg: float
    rating_count: int
    comment_count: int
    view_count: int
    distance_m: float | None = None
    heat: int = 0
    created_at: datetime
    city: CityBrief
    author: AuthorOut


class SpotDetail(SpotListItem):
    content: str
    address: str | None
    lat: float
    lng: float
    images: list[str]
    my_rating: float | None = None
    is_author: bool = False


class SpotQuery(BaseModel):
    """列表查询参数（以 Depends 方式使用时会自动从 query string 解析）。"""

    city_id: int | None = None
    sort: str = "hot"
    lat: float | None = None
    lng: float | None = None
    keyword: str | None = None
    page: int = Field(default=1, ge=1)
    size: int = Field(default=10, ge=1, le=50)
