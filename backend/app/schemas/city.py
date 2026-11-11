"""城市与定位相关结构。"""

from pydantic import BaseModel, ConfigDict


class CityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    province: str
    lat: float
    lng: float
    is_hot: bool


class LocateOut(BaseModel):
    """定位结果：source 说明城市是怎么来的，前端可据此决定是否提示用户。"""

    city: CityOut
    source: str  # coordinate | ip | default
    distance_m: float | None = None
