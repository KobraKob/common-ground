from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base
from app.seed import run_seed

# Import routers
from app.modules.identity.router import router as identity_router
from app.modules.colleges.router import router as colleges_router
from app.modules.communities.router import router as communities_router
from app.modules.commons.router import router as commons_router
from app.modules.projects.router import router as projects_router
from app.modules.moderation.router import router as moderation_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed demo data
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        await run_seed()
    except Exception as e:
        print(f"[Startup Seed Warning] {e}")
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CommonGround — Cross-Campus Student Network & Collaboration Platform API",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Next.js, Capacitor, and local mobile dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": str(exc)},
    )


# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "CommonGround Backend API",
        "version": settings.VERSION,
        "cluster": "Bengaluru Phase 1",
    }


# Include Module Routers with /api/v1 prefix
app.include_router(identity_router, prefix=settings.API_V1_PREFIX)
app.include_router(colleges_router, prefix=settings.API_V1_PREFIX)
app.include_router(communities_router, prefix=settings.API_V1_PREFIX)
app.include_router(commons_router, prefix=settings.API_V1_PREFIX)
app.include_router(projects_router, prefix=settings.API_V1_PREFIX)
app.include_router(moderation_router, prefix=settings.API_V1_PREFIX)
