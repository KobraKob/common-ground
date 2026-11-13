from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base

# Import routers
from app.modules.identity.router import router as identity_router, auth_router
from app.modules.colleges.router import router as colleges_router
from app.modules.communities.router import router as communities_router
from app.modules.commons.router import router as commons_router
from app.modules.projects.router import router as projects_router
from app.modules.moderation.router import router as moderation_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is ready and college cluster reference directory is initialized
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def migrate_sqlite_columns(sync_conn):
            if sync_conn.dialect.name == "sqlite":
                existing_posts_cols = [r[1] for r in sync_conn.exec_driver_sql("PRAGMA table_info(posts)").fetchall()]
                if "media_url" not in existing_posts_cols:
                    sync_conn.exec_driver_sql("ALTER TABLE posts ADD COLUMN media_url TEXT;")
                if "media_type" not in existing_posts_cols:
                    sync_conn.exec_driver_sql("ALTER TABLE posts ADD COLUMN media_type TEXT;")
                if "shares_count" not in existing_posts_cols:
                    sync_conn.exec_driver_sql("ALTER TABLE posts ADD COLUMN shares_count INTEGER DEFAULT 0;")

                existing_users_cols = [r[1] for r in sync_conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()]
                if "password_hash" not in existing_users_cols:
                    sync_conn.exec_driver_sql("ALTER TABLE users ADD COLUMN password_hash TEXT;")

        await conn.run_sync(migrate_sqlite_columns)

    try:
        from app.seed import init_college_directory
        await init_college_directory()
    except Exception as exc:
        print(f"[Directory Init Warning] {exc}")

    yield
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CommonGround — Cross-Campus Student Network & Collaboration Platform API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Avoid leaking SQL, credentials, and internal exception details.
    print(f"[Unhandled API Error] {type(exc).__name__}: {exc}")
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


app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(identity_router, prefix=settings.API_V1_PREFIX)
app.include_router(colleges_router, prefix=settings.API_V1_PREFIX)
app.include_router(communities_router, prefix=settings.API_V1_PREFIX)
app.include_router(commons_router, prefix=settings.API_V1_PREFIX)
app.include_router(projects_router, prefix=settings.API_V1_PREFIX)
app.include_router(moderation_router, prefix=settings.API_V1_PREFIX)
