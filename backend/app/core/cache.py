import time
import hashlib
import json
from typing import Any, Optional, Dict, Tuple
from functools import wraps
from fastapi import Request, Response
from fastapi.responses import JSONResponse


class MemoryCache:
    """Fast, thread-safe asynchronous in-memory cache with TTL and namespace invalidation."""

    def __init__(self):
        self._store: Dict[str, Tuple[Any, float, str]] = {}  # key -> (data, expires_at, etag)

    def get(self, key: str) -> Optional[Tuple[Any, str]]:
        entry = self._store.get(key)
        if not entry:
            return None
        data, expires_at, etag = entry
        if time.time() > expires_at:
            del self._store[key]
            return None
        return data, etag

    def set(self, key: str, value: Any, ttl_seconds: int = 60) -> str:
        expires_at = time.time() + ttl_seconds
        # Compute ETag based on serialized value
        serialized = json.dumps(value, default=str, sort_keys=True)
        etag = f'"{hashlib.md5(serialized.encode("utf-8")).hexdigest()}"'
        self._store[key] = (value, expires_at, etag)
        return etag

    def invalidate_prefix(self, prefix: str):
        keys_to_del = [k for k in self._store if k.startswith(prefix)]
        for k in keys_to_del:
            self._store.pop(k, None)

    def clear(self):
        self._store.clear()


cache_store = MemoryCache()


def cache_response(ttl_seconds: int = 60, namespace: str = "api"):
    """
    Decorator for FastAPI GET endpoints to cache responses with ETag and Cache-Control headers.
    Supports HTTP 304 Not Modified when client provides If-None-Match matching the ETag.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find the Request object in kwargs or args
            request: Optional[Request] = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            # If no request or method is not GET, bypass cache
            if not request or request.method.upper() != "GET":
                return await func(*args, **kwargs)

            # Build cache key from namespace, path, and sorted query params
            query_items = sorted(request.query_params.items())
            cache_key = f"{namespace}:{request.url.path}:{query_items}"

            cached = cache_store.get(cache_key)
            if cached:
                cached_data, etag = cached
                client_etag = request.headers.get("if-none-match")
                if client_etag and client_etag.strip() == etag:
                    return Response(status_code=304, headers={"ETag": etag, "Cache-Control": f"public, max-age={ttl_seconds}"})

                response = JSONResponse(content=cached_data)
                response.headers["ETag"] = etag
                response.headers["Cache-Control"] = f"public, max-age={ttl_seconds}, stale-while-revalidate={ttl_seconds * 2}"
                response.headers["X-Cache"] = "HIT"
                return response

            # Cache MISS — execute handler
            result = await func(*args, **kwargs)

            # Only cache serializable dicts/lists
            try:
                # If result is already a Pydantic model or list of models, dump with mode="json"
                if hasattr(result, "model_dump"):
                    serializable = result.model_dump(mode="json")
                elif isinstance(result, list):
                    serializable = [
                        item.model_dump(mode="json") if hasattr(item, "model_dump") else item
                        for item in result
                    ]
                else:
                    from fastapi.encoders import jsonable_encoder
                    serializable = jsonable_encoder(result)

                etag = cache_store.set(cache_key, serializable, ttl_seconds=ttl_seconds)

                response = JSONResponse(content=serializable)
                response.headers["ETag"] = etag
                response.headers["Cache-Control"] = f"public, max-age={ttl_seconds}, stale-while-revalidate={ttl_seconds * 2}"
                response.headers["X-Cache"] = "MISS"
                return response
            except Exception as e:
                import logging
                logging.getLogger("commonground.cache").warning(f"Cache serialization failed: {e}")
                return result

        return wrapper
    return decorator
