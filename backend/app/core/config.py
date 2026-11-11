"""应用配置。

所有配置都可以通过环境变量或 backend/.env 覆盖；默认值面向本地开发，
生产环境至少需要替换 SECRET_KEY 与 DATABASE_URL。
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "野钓客 API"
    api_prefix: str = "/api"
    debug: bool = True

    # --- 数据源 ---------------------------------------------------------
    # 默认指向本机 mock_prod_db，业务表统一 wf_ 前缀，避免与博客系统的表混在一起。
    database_url: str = (
        "mysql+pymysql://app_user:app_password_123@127.0.0.1:3306/mock_prod_db"
        "?charset=utf8mb4"
    )

    # --- 鉴权 -----------------------------------------------------------
    secret_key: str = "dev-only-secret-please-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 一周

    # --- 其它 -----------------------------------------------------------
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    default_city: str = "杭州"
    public_base_url: str = "http://localhost:8000"

    @property
    def cors_origin_list(self) -> list[str]:
        """把逗号分隔的配置转成列表，供 CORSMiddleware 使用。"""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """缓存配置实例，避免每次请求都读取 .env。"""
    return Settings()


settings = get_settings()
