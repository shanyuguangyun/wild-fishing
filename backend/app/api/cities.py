"""城市列表与定位。"""

from fastapi import APIRouter, Query
from sqlalchemy import or_, select

from app.api.deps import DbSession
from app.models.city import City
from app.schemas.city import CityOut, LocateOut
from app.services.geo import default_city, nearest_city

router = APIRouter(tags=["城市"])


@router.get("/cities", response_model=list[CityOut])
def list_cities(
    db: DbSession,
    keyword: str | None = Query(default=None, max_length=32, description="城市名或拼音，支持模糊"),
    hot_only: bool = Query(default=False, description="只返回热门城市"),
) -> list[CityOut]:
    """城市选择器数据源：无关键词时优先返回热门城市。"""
    stmt = select(City)
    if keyword:
        pattern = f"%{keyword.strip()}%"
        stmt = stmt.where(or_(City.name.like(pattern), City.pinyin.like(pattern)))
    elif hot_only:
        stmt = stmt.where(City.is_hot.is_(True))
    stmt = stmt.order_by(City.is_hot.desc(), City.id)
    return [CityOut.model_validate(city) for city in db.scalars(stmt).all()]


@router.get("/geo/locate", response_model=LocateOut)
def locate(
    db: DbSession,
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
) -> LocateOut:
    """根据浏览器坐标反查最近城市。

    没有坐标（用户拒绝授权 / 浏览器不支持）时退回默认城市。
    真实项目里还可以接 IP 库，这里保持零外部依赖。
    """
    if lat is not None and lng is not None:
        city, distance = nearest_city(db, lat, lng)
        return LocateOut(city=CityOut.model_validate(city), source="coordinate", distance_m=round(distance, 1))

    city = default_city(db)
    return LocateOut(city=CityOut.model_validate(city), source="default")
