"""FastAPI 应用入口。

启动：uvicorn app.main:app --reload --port 8000
文档：http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import auth, cities, spots
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    description="野钓客 C 端接口：城市定位、点位分享、评论与评分。",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 上传的图片放在 backend/static，开发期直接由后端托管，省去对象存储
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(cities.router, prefix=settings.api_prefix)
app.include_router(spots.router, prefix=settings.api_prefix)


@app.get("/api/health", tags=["系统"])
def health() -> dict[str, str]:
    """健康检查：前端启动时可用它判断后端是否在线。"""
    return {"status": "ok", "app": settings.app_name}
