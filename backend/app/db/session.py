"""数据库连接与会话管理。

使用同步驱动（PyMySQL）：本项目查询简单、并发不高，同步实现比 async 更易读，
FastAPI 会把 `def` 路由放进线程池执行，不会阻塞事件循环。
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,   # 断线自动重连，避免 MySQL 8 小时空闲断连
    pool_recycle=3600,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI 依赖：每个请求一个会话，结束后自动关闭。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
