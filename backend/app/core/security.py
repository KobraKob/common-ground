from typing import Optional

import httpx
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db

security_scheme = HTTPBearer(auto_error=False)


async def get_optional_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
) -> Optional[str]:
    """
    Resolve identity optionally. Returns None when no valid credentials are provided
    without raising 401 Unauthorized, allowing public feeds/profiles/search to work.
    """
    if credentials and credentials.credentials:
        if credentials.credentials.startswith("cg-user_"):
            return credentials.credentials.replace("cg-user_", "")

    if x_user_id:
        return x_user_id

    if not credentials or not credentials.credentials:
        return None

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {credentials.credentials}",
                },
            )
        if response.status_code != 200:
            return None
        payload = response.json()
        user_id = payload.get("id")
        return str(user_id) if user_id else None
    except httpx.RequestError:
        return None


async def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
) -> str:
    """
    Resolve user identity through CommonGround native session tokens or Supabase Auth.
    """
    if credentials and credentials.credentials:
        if credentials.credentials.startswith("cg-user_"):
            return credentials.credentials.replace("cg-user_", "")

    if x_user_id:
        return x_user_id

    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {credentials.credentials}",
                },
            )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        payload = response.json()
        user_id = payload.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has no user identity",
            )
        return str(user_id)
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable",
        )


async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve user record and ensure account is active (not suspended).
    """
    from app.modules.identity.models import User

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found",
        )

    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been suspended by community moderation",
        )

    return user
