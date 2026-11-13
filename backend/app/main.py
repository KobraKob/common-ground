from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base
from app.core.monitoring import PerformanceMonitoringMiddleware, monitoring_router

# Import routers
from app.modules.identity.router import router as identity_router, auth_router
from app.modules.analytics.router import router as analytics_router
from app.modules.colleges.router import router as colleges_router
from app.modules.communities.router import router as communities_router
from app.modules.commons.router import router as commons_router
from app.modules.projects.router import router as projects_router
from app.modules.moderation.router import router as moderation_router

logger = logging.getLogger('commonground.api')


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Production schema changes are applied through reviewed Supabase migrations.
    # create_all and the SQLite compatibility migration are development-only.
    if settings.ENVIRONMENT.lower() in {"development", "dev", "local", "test"}:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

            def migrate_sqlite_columns_and_indices(sync_conn):
                if sync_conn.dialect.name == "sqlite":
                    existing_posts_cols = [
                        row[1] for row in sync_conn.exec_driver_sql("PRAGMA table_info(posts)").fetchall()
                    ]
                    if "media_url" not in existing_posts_cols:
                        sync_conn.exec_driver_sql("ALTER TABLE posts ADD COLUMN media_url TEXT;")
                    if "media_type" not in existing_posts_cols:
                        sync_conn.exec_driver_sql("ALTER TABLE posts ADD COLUMN media_type TEXT;")
                    if "shares_count" not in existing_posts_cols:
                        sync_conn.exec_driver_sql("ALTER TABLE posts ADD COLUMN shares_count INTEGER DEFAULT 0;")

                    existing_users_cols = [
                        row[1] for row in sync_conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()
                    ]
                    if "password_hash" not in existing_users_cols:
                        sync_conn.exec_driver_sql("ALTER TABLE users ADD COLUMN password_hash TEXT;")

                    # Performance Indexes for SQLite
                    indexes_to_create = [
                        "CREATE INDEX IF NOT EXISTS ix_posts_author ON posts(author_id);",
                        "CREATE INDEX IF NOT EXISTS ix_posts_comm ON posts(community_id);",
                        "CREATE INDEX IF NOT EXISTS ix_posts_col ON posts(college_id);",
                        "CREATE INDEX IF NOT EXISTS ix_posts_cat ON posts(category);",
                        "CREATE INDEX IF NOT EXISTS ix_posts_cr ON posts(created_at);",
                        "CREATE INDEX IF NOT EXISTS ix_posts_feed_ordering ON posts(is_hidden_by_mod, is_pinned, created_at);",
                        "CREATE INDEX IF NOT EXISTS ix_posts_category_created ON posts(category, created_at);",
                        "CREATE INDEX IF NOT EXISTS ix_posts_college_created ON posts(college_id, created_at);",
                        "CREATE INDEX IF NOT EXISTS ix_messages_conv_created ON messages(conversation_id, created_at);",
                        "CREATE INDEX IF NOT EXISTS ix_messages_sender ON messages(sender_id);",
                        "CREATE INDEX IF NOT EXISTS ix_conv_members_user ON conversation_members(user_id);",
                        "CREATE INDEX IF NOT EXISTS ix_comments_post_created ON comments(post_id, created_at);",
                        "CREATE INDEX IF NOT EXISTS ix_reactions_target ON reactions(target_type, target_id);",
                        "CREATE INDEX IF NOT EXISTS ix_user_blocks_pair ON user_blocks(blocker_id, blocked_id);",
                        "CREATE INDEX IF NOT EXISTS ix_profiles_college_stage ON student_profiles(college_id, verification_stage);",
                        "CREATE INDEX IF NOT EXISTS ix_projects_stage_created ON projects(stage, created_at);",
                        "CREATE INDEX IF NOT EXISTS ix_reports_target ON reports(target_type, target_id);",
                        "CREATE INDEX IF NOT EXISTS ix_analytics_name_created ON analytics_events(event_name, created_at);",
                    ]
                    for idx_sql in indexes_to_create:
                        try:
                            sync_conn.exec_driver_sql(idx_sql)
                        except Exception as idx_err:
                            logger.warning("SQLite index initialization skipped: %s", type(idx_err).__name__)

            await conn.run_sync(migrate_sqlite_columns_and_indices)

    if settings.ENVIRONMENT.lower() in {"development", "dev", "local", "test"}:
        try:
            from app.seed import init_college_directory
            await init_college_directory()
        except Exception as exc:
            logger.warning("College directory initialization failed: %s", type(exc).__name__)

    yield
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CommonGround — Cross-Campus Student Network & Collaboration Platform API",
    lifespan=lifespan,
)

app.add_middleware(PerformanceMonitoringMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID", "X-User-Id"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Avoid leaking SQL, credentials, and internal exception details.
    logger.error("Unhandled API error: %s %s (%s)", request.method, request.url.path, type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error"},
    )


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "CommonGround Backend API",
        "version": settings.VERSION,
        "cluster": "Bengaluru Phase 1",
    }

@app.get("/ready", tags=["System"])
async def readiness_check():
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception:
        logger.warning("Readiness probe failed: database unavailable")
        return JSONResponse(status_code=503, content={"status": "not_ready", "dependency": "database"})
    return {"status": "ready", "service": "CommonGround API"}




app.include_router(monitoring_router, prefix=settings.API_V1_PREFIX)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(identity_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(colleges_router, prefix=settings.API_V1_PREFIX)
app.include_router(communities_router, prefix=settings.API_V1_PREFIX)
app.include_router(commons_router, prefix=settings.API_V1_PREFIX)
app.include_router(projects_router, prefix=settings.API_V1_PREFIX)
app.include_router(moderation_router, prefix=settings.API_V1_PREFIX)
