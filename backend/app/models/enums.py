"""业务枚举。

统一用字符串常量存库（而不是 MySQL ENUM）：加类型只需改代码，不用锁表迁移；
取值范围由 Pydantic 校验保证，前端也能直接展示中文。
"""

from enum import StrEnum


class WaterType(StrEnum):
    """水域类型。"""

    RIVER = "river"          # 河流
    LAKE = "lake"            # 湖泊
    RESERVOIR = "reservoir"  # 水库
    POND = "pond"            # 鱼塘 / 黑坑
    SEA = "sea"              # 海钓

    @property
    def label(self) -> str:
        return _WATER_LABELS[self]


_WATER_LABELS = {
    WaterType.RIVER: "河流",
    WaterType.LAKE: "湖泊",
    WaterType.RESERVOIR: "水库",
    WaterType.POND: "黑坑",
    WaterType.SEA: "海钓",
}


class FeeType(StrEnum):
    """收费方式。"""

    FREE = "free"
    PAID = "paid"

    @property
    def label(self) -> str:
        return "免费" if self is FeeType.FREE else "收费"


class SpotEventType(StrEnum):
    """点位互动事件，用于计算「近期热度」。"""

    VIEW = "view"
    COMMENT = "comment"
    RATING = "rating"
    FAVORITE = "favorite"


class SpotSort(StrEnum):
    """点位列表排序方式。"""

    DISTANCE = "distance"  # 距离：需要请求带经纬度，否则自动退化为热度
    RATING = "rating"      # 评分
    HOT = "hot"            # 近期热度（近 7 天互动加权）
