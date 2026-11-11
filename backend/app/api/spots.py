"""点位相关接口。"""

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, OptionalUser
from app.models.comment import Comment
from app.models.enums import SpotSort
from app.models.spot import Spot
from app.schemas.comment import CommentCreate, CommentOut, RatingIn, RatingResult
from app.schemas.common import Page
from app.schemas.spot import AuthorOut, SpotCreate, SpotDetail, SpotListItem
from app.services import spot_service

router = APIRouter(prefix="/spots", tags=["点位"])


def _get_spot_or_404(db: DbSession, spot_id: int) -> Spot:
    spot = db.get(Spot, spot_id)
    if spot is None or not spot.is_published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="点位不存在")
    return spot


@router.get("", response_model=Page[SpotListItem])
def list_spots(
    db: DbSession,
    city_id: int | None = Query(default=None, description="按城市过滤"),
    sort: SpotSort = Query(default=SpotSort.HOT, description="distance / rating / hot"),
    lat: float | None = Query(default=None, ge=-90, le=90, description="用户纬度，距离排序必填"),
    lng: float | None = Query(default=None, ge=-180, le=180, description="用户经度"),
    keyword: str | None = Query(default=None, max_length=50),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=50),
) -> Page[SpotListItem]:
    """点位列表。三种排序对应二级页的三个 tab。"""
    return spot_service.list_spots(
        db,
        city_id=city_id,
        sort=sort,
        lat=lat,
        lng=lng,
        keyword=keyword,
        page=page,
        size=size,
    )


@router.post("", response_model=SpotDetail, status_code=status.HTTP_201_CREATED)
def create_spot(payload: SpotCreate, db: DbSession, user: CurrentUser) -> SpotDetail:
    """发布点位（需登录）。"""
    spot = spot_service.create_spot(db, payload, user)
    base = spot_service.to_list_item(spot)
    return SpotDetail(
        **base.model_dump(),
        content=spot.content,
        address=spot.address,
        lat=float(spot.lat),
        lng=float(spot.lng),
        images=[image.url for image in spot.images],
        is_author=True,
    )


@router.get("/{spot_id}", response_model=SpotDetail)
def get_spot(spot_id: int, db: DbSession, viewer: OptionalUser) -> SpotDetail:
    """点位详情。登录用户会额外拿到自己的评分。"""
    detail = spot_service.get_detail(db, spot_id, viewer)
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="点位不存在")
    return detail


@router.get("/{spot_id}/comments", response_model=list[CommentOut])
def list_comments(spot_id: int, db: DbSession, viewer: OptionalUser) -> list[CommentOut]:
    """评论按时间正序，前端按 parent_id 组装成「评论 + 回复」。"""
    _get_spot_or_404(db, spot_id)
    rows = db.scalars(
        select(Comment).where(Comment.spot_id == spot_id).order_by(Comment.created_at.asc())
    ).all()
    return [
        CommentOut(
            id=row.id,
            content=row.content,
            created_at=row.created_at,
            parent_id=row.parent_id,
            user=AuthorOut.model_validate(row.user),
            is_mine=bool(viewer and viewer.id == row.user_id),
        )
        for row in rows
    ]


@router.post(
    "/{spot_id}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    spot_id: int, payload: CommentCreate, db: DbSession, user: CurrentUser
) -> CommentOut:
    """发表评论 / 回复（需登录）。"""
    spot = _get_spot_or_404(db, spot_id)
    if payload.parent_id is not None:
        parent = db.get(Comment, payload.parent_id)
        if parent is None or parent.spot_id != spot.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="回复的评论不存在")
    comment = spot_service.add_comment(db, spot, user, payload.content, payload.parent_id)
    return CommentOut(
        id=comment.id,
        content=comment.content,
        created_at=comment.created_at,
        parent_id=comment.parent_id,
        user=AuthorOut.model_validate(user),
        is_mine=True,
    )


@router.post("/{spot_id}/rating", response_model=RatingResult)
def rate_spot(spot_id: int, payload: RatingIn, db: DbSession, user: CurrentUser) -> RatingResult:
    """打分（需登录）：重复提交视为修改。"""
    spot = _get_spot_or_404(db, spot_id)
    spot, my_score = spot_service.upsert_rating(db, spot, user, payload.score)
    return RatingResult(
        rating_avg=float(spot.rating_avg),
        rating_count=spot.rating_count,
        my_rating=my_score,
    )
