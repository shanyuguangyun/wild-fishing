"""地理位置工具。

城市匹配用 Haversine 公式在 Python 侧算（城市表只有几百行，全量计算比让数据库做
空间索引更简单）；点位距离排序交给 MySQL 的 ST_Distance_Sphere，
避免把点位全量拉到内存里再排序。
"""

import math
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.city import City

EARTH_RADIUS_M = 6_371_000


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """两点球面距离（米）。"""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = phi2 - phi1
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def nearest_city(db: Session, lat: float, lng: float) -> tuple[City, float]:
    """返回距离坐标最近的城市及其距离（米）。"""
    cities = db.scalars(select(City)).all()
    if not cities:
        raise RuntimeError("城市表为空，请先执行 scripts/seed.py")
    best = min(
        cities,
        key=lambda c: haversine_m(lat, lng, float(c.lat), float(c.lng)),
    )
    return best, haversine_m(lat, lng, float(best.lat), float(best.lng))


def default_city(db: Session) -> City:
    """定位失败时的兜底城市：先按配置名找，再退到第一个热门城市。"""
    city = db.scalar(select(City).where(City.name == settings.default_city))
    if city:
        return city
    city = db.scalar(select(City).where(City.is_hot.is_(True)).order_by(City.id))
    if city:
        return city
    city = db.scalar(select(City).order_by(City.id))
    if city is None:
        raise RuntimeError("城市表为空，请先执行 scripts/seed.py")
    return city


def as_float(value: Decimal | float | None) -> float | None:
    return None if value is None else float(value)
