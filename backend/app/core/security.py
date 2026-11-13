from typing import Optional
from datetime import datetime, timedelta, timezone

import jwt

import httpx
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db

security_scheme = HTTPBearer(auto_error=False)

_NATIVE_TOKEN_ISSUER = "commonground"
_ACCESS_TOKEN_TTL = timedelta(hours=12)


def _token_secret() -> str:
    secret = settings.SECRET_KEY.strip()
    if secret:
        return secret
    if settings.ENVIRONMENT.lower() in {"development", "dev", "local", "test"}:
        return "commonground-local-development-only-signing-key"
    raise RuntimeError("SECRET_KEY must be configured before issuing access tokens.")


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iss": _NATIVE_TOKEN_ISSUER,
        "iat": now,
        "exp": now + _ACCESS_TOKEN_TTL,
        "token_type": "access",
    }
    return jwt.encode(payload, _token_secret(), algorithm="HS256")


def _decode_native_access_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(
            token,
            _token_secret(),
            algorithms=["HS256"],
            issuer=_NATIVE_TOKEN_ISSUER,
            options={"require": ["sub", "iat", "exp", "iss"]},
        )
    except jwt.InvalidTokenError:
        return None
    if payload.get("token_type") != "access":
        return None
    subject = payload.get("sub")
    return str(subject) if subject else None


async def get_optional_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
) -> Optional[str]:
    """
    Resolve a verified identity when credentials are present.
    Invalid or missing credentials remain anonymous for public endpoints.
    """
    if settings.ENVIRONMENT.lower() in {"development", "dev", "local", "test"} and x_user_id:
        return x_user_id
    if not credentials or not credentials.credentials:
        return None

    token = credentials.credentials
    if token.startswith("cg-user_") and settings.ENVIRONMENT.lower() in {"development", "dev", "local", "test"}:
        return token.removeprefix("cg-user_") or None
    native_user_id = _decode_native_access_token(token)
    if native_user_id:
        return native_user_id

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {token}",
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
    """Resolve verified access tokens in production; allow explicit test identities only locally."""
    if settings.ENVIRONMENT.lower() in {"development", "dev", "local", "test"} and x_user_id:
        return x_user_id
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    if token.startswith("cg-user_") and settings.ENVIRONMENT.lower() in {"development", "dev", "local", "test"}:
        return token.removeprefix("cg-user_")
    native_user_id = _decode_native_access_token(token)
    if native_user_id:
        return native_user_id

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {token}",
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
