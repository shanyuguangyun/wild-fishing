"""模型汇总出口。

Alembic 的 env.py 只需 `import app.models`，就能拿到全部表定义。
"""

from app.db.base import Base
from app.models.city import City
from app.models.comment import Comment
from app.models.rating import Rating
from app.models.spot import Spot, SpotImage
from app.models.spot_event import SpotEvent
from app.models.user import User

__all__ = ["Base", "City", "Comment", "Rating", "Spot", "SpotImage", "SpotEvent", "User"]
