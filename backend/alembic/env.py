"""Alembic 运行环境。

直接复用应用的 settings 与 Base.metadata：
- 迁移脚本不会和 ORM 定义脱节；
- 切换数据库只改 .env，不用改 alembic.ini。
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine

from app.core.config import settings
from app.models import Base  # noqa: F401  导入即注册全部表

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def include_object(obj, name, type_, reflected, compare_to):
    """只管理 wf_ 前缀的表。

    本项目与博客系统共用 mock_prod_db，若不限制，autogenerate 会把 ps_* 表
    当成「模型里已删除」而生成 DROP TABLE —— 一次迁移就能删掉别人的数据。
    """
    if type_ == "table":
        return name.startswith("wf_") or name == "alembic_version"
    return True


def run_migrations_offline() -> None:
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(settings.database_url, pool_pre_ping=True)
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            include_object=include_object,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
