"""点位业务逻辑。

把查询构造、统计维护、DTO 组装集中在 service 层，路由只负责参数与鉴权，
这样排序规则、热度权重这些「产品规则」只有一处定义，改起来不会漏。
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.enums import FeeType, SpotEventType, SpotSort, WaterType
from app.models.rating import Rating
from app.models.spot import Spot, SpotImage
from app.models.spot_event import SpotEvent
from app.models.user import User
from app.schemas.common import Page
from app.schemas.spot import AuthorOut, CityBrief, SpotCreate, SpotDetail, SpotListItem

# 热度权重：评论比浏览更能说明内容有价值，评分介于两者之间
WEIGHT_VIEW = 1
WEIGHT_COMMENT = 3
WEIGHT_RATING = 2
HOT_WINDOW_DAYS = 7


def _labels(spot: Spot) -> tuple[str, str]:
    return WaterType(spot.water_type).label, FeeType(spot.fee_type).label


def to_list_item(spot: Spot, distance_m: float | None = None, heat: int = 0) -> SpotListItem:
    """ORM -> 列表卡片 DTO。"""
    water_label, fee_label = _labels(spot)
    return SpotListItem(
        id=spot.id,
        title=spot.title,
        summary=spot.summary,
        cover_url=spot.cover_url,
        location_name=spot.location_name,
        water_type=spot.water_type,
        water_type_label=water_label,
        fee_type=spot.fee_type,
        fee_type_label=fee_label,
        fish_types=spot.fish_types or [],
        rating_avg=float(spot.rating_avg),
        rating_count=spot.rating_count,
        comment_count=spot.comment_count,
        view_count=spot.view_count,
        distance_m=None if distance_m is None else round(distance_m, 1),
        heat=heat,
        created_at=spot.created_at,
        city=CityBrief(id=spot.city.id, name=spot.city.name),
        author=AuthorOut.model_validate(spot.author),
    )


def list_spots(
    db: Session,
    *,
    city_id: int | None,
    sort: SpotSort,
    lat: float | None,
    lng: float | None,
    keyword: str | None,
    page: int,
    size: int,
) -> Page[SpotListItem]:
    """按城市 + 排序方式取点位列表。

    - distance：需要经纬度，缺省时自动退化为热度排序（前端没授权定位也不会报错）
    - rating：平均分优先，分相同看评分人数
    - hot：近 7 天加权互动量
    """
    since = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=HOT_WINDOW_DAYS)

    # 热度子查询：只扫近 7 天的事件，索引 (created_at) 支撑
    heat_subq = (
        select(
            SpotEvent.spot_id.label("spot_id"),
            func.coalesce(func.sum(SpotEvent.weight), 0).label("heat"),
        )
        .where(SpotEvent.created_at >= since)
        .group_by(SpotEvent.spot_id)
        .subquery()
    )

    distance_col = None
    if lat is not None and lng is not None:
        distance_col = func.st_distance_sphere(
            func.point(Spot.lng, Spot.lat), func.point(lng, lat)
        ).label("distance_m")

    columns = [Spot, heat_subq.c.heat.label("heat")]
    if distance_col is not None:
        columns.append(distance_col)

    stmt = (
        select(*columns)
        .outerjoin(heat_subq, heat_subq.c.spot_id == Spot.id)
        .where(Spot.is_published.is_(True))
    )
    count_stmt = select(func.count(Spot.id)).where(Spot.is_published.is_(True))

    if city_id:
        stmt = stmt.where(Spot.city_id == city_id)
        count_stmt = count_stmt.where(Spot.city_id == city_id)

    if keyword:
        pattern = f"%{keyword.strip()}%"
        condition = or_(Spot.title.like(pattern), Spot.location_name.like(pattern))
        stmt = stmt.where(condition)
        count_stmt = count_stmt.where(condition)

    if sort is SpotSort.DISTANCE and distance_col is not None:
        stmt = stmt.order_by(distance_col.asc(), Spot.id.desc())
    elif sort is SpotSort.RATING:
        stmt = stmt.order_by(Spot.rating_avg.desc(), Spot.rating_count.desc(), Spot.id.desc())
    else:
        stmt = stmt.order_by(heat_subq.c.heat.desc(), Spot.created_at.desc(), Spot.id.desc())

    total = db.scalar(count_stmt) or 0
    rows = db.execute(stmt.offset((page - 1) * size).limit(size)).all()

    items = [
        to_list_item(
            row[0],
            distance_m=float(row[-1]) if distance_col is not None else None,
            heat=int(row[1] or 0),
        )
        for row in rows
    ]
    return Page[SpotListItem](
        items=items, total=total, page=page, size=size, has_more=page * size < total
    )


def get_detail(db: Session, spot_id: int, viewer: User | None) -> SpotDetail | None:
    """详情页：顺带记一次浏览事件（用于热度），并回填「我的评分」。"""
    heat_subq = (
        select(func.coalesce(func.sum(SpotEvent.weight), 0))
        .where(
            SpotEvent.spot_id == spot_id,
            SpotEvent.created_at >= datetime.now(UTC).replace(tzinfo=None) - timedelta(days=HOT_WINDOW_DAYS),
        )
        .scalar_subquery()
    )
    row = db.execute(select(Spot, heat_subq.label("heat")).where(Spot.id == spot_id)).first()
    if row is None or not row[0].is_published:
        return None

    spot: Spot = row[0]
    heat = int(row[1] or 0)

    # 浏览计数与事件：同一事务，失败不影响读取
    spot.view_count += 1
    db.add(SpotEvent(spot_id=spot.id, user_id=viewer.id if viewer else None,
                     event_type=SpotEventType.VIEW, weight=WEIGHT_VIEW))
    db.commit()
    db.refresh(spot)

    my_rating = None
    if viewer:
        my_rating = db.scalar(
            select(Rating.score).where(Rating.spot_id == spot.id, Rating.user_id == viewer.id)
        )

    base = to_list_item(spot, distance_m=None, heat=heat)
    return SpotDetail(
        **base.model_dump(),
        content=spot.content,
        address=spot.address,
        lat=float(spot.lat),
        lng=float(spot.lng),
        images=[image.url for image in spot.images],
        my_rating=float(my_rating) if my_rating is not None else None,
        is_author=bool(viewer and viewer.id == spot.author_id),
    )


def create_spot(db: Session, payload: SpotCreate, author: User) -> Spot:
    spot = Spot(
        city_id=payload.city_id,
        author_id=author.id,
        title=payload.title,
        summary=payload.summary or payload.content[:80],
        content=payload.content,
        cover_url=payload.cover_url,
        location_name=payload.location_name,
        address=payload.address,
        lat=payload.lat,
        lng=payload.lng,
        water_type=payload.water_type.value,
        fee_type=payload.fee_type.value,
        fish_types=payload.fish_types,
    )
    spot.images = [SpotImage(url=url, sort_order=index) for index, url in enumerate(payload.images)]
    db.add(spot)
    db.commit()
    db.refresh(spot)
    return spot


def add_comment(db: Session, spot: Spot, user: User, content: str, parent_id: int | None) -> Comment:
    """写评论：同事务维护评论数与热度事件。"""
    comment = Comment(spot_id=spot.id, user_id=user.id, content=content.strip(), parent_id=parent_id)
    spot.comment_count += 1
    db.add(comment)
    db.add(SpotEvent(spot_id=spot.id, user_id=user.id,
                     event_type=SpotEventType.COMMENT, weight=WEIGHT_COMMENT))
    db.commit()
    db.refresh(comment)
    return comment


def upsert_rating(db: Session, spot: Spot, user: User, score: float) -> tuple[Spot, float]:
    """打分：一人一条，重复提交是修改而不是新增。"""
    existing = db.scalar(
        select(Rating).where(Rating.spot_id == spot.id, Rating.user_id == user.id)
    )
    if existing is None:
        db.add(Rating(spot_id=spot.id, user_id=user.id, score=score))
        spot.rating_count += 1
        spot.rating_sum += score
    else:
        spot.rating_sum += score - float(existing.score)
        existing.score = score

    spot.rating_avg = round(spot.rating_sum / spot.rating_count, 2) if spot.rating_count else 0
    db.add(SpotEvent(spot_id=spot.id, user_id=user.id,
                     event_type=SpotEventType.RATING, weight=WEIGHT_RATING))
    db.commit()
    db.refresh(spot)
    return spot, score
