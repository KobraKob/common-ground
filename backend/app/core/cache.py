import hashlib
import json
import threading
import time
from collections import OrderedDict
from functools import wraps
from typing import Any, Dict, Optional, Tuple

from fastapi import Request, Response
from fastapi.responses import JSONResponse


class MemoryCache:
    """Bounded, thread-safe TTL cache. Suitable for public, process-local read models."""

    def __init__(self, max_entries: int = 1024):
        self.max_entries = max_entries
        self._store: OrderedDict[str, Tuple[Any, float, str]] = OrderedDict()
        self._lock = threading.RLock()

    def get(self, key: str) -> Optional[Tuple[Any, str]]:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            data, expires_at, etag = entry
            if time.monotonic() >= expires_at:
                self._store.pop(key, None)
                return None
            self._store.move_to_end(key)
            return data, etag

    def set(self, key: str, value: Any, ttl_seconds: int = 60) -> str:
        serialized = json.dumps(value, default=str, sort_keys=True, separators=(",", ":"))
        etag = '"' + hashlib.sha256(serialized.encode("utf-8")).hexdigest() + '"'
        with self._lock:
            self._store[key] = (value, time.monotonic() + max(1, ttl_seconds), etag)
            self._store.move_to_end(key)
            while len(self._store) > self.max_entries:
                self._store.popitem(last=False)
        return etag

    def invalidate_prefix(self, prefix: str) -> None:
        with self._lock:
            for key in [key for key in self._store if key.startswith(prefix)]:
                self._store.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


cache_store = MemoryCache()


def cache_response(ttl_seconds: int = 60, namespace: str = "api"):
    """Cache public GET responses with ETag support; bypass all authenticated requests."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request: Optional[Request] = kwargs.get("request")
            if request is None:
                request = next((arg for arg in args if isinstance(arg, Request)), None)
            if request is None or request.method.upper() != "GET":
                return await func(*args, **kwargs)

            # A public response may become user-specific as routes evolve. Never share
            # cached responses when cookies or bearer credentials are present.
            if request.headers.get("authorization") or request.headers.get("cookie"):
                return await func(*args, **kwargs)

            query_items = sorted(request.query_params.items())
            cache_key = f"{namespace}:{request.url.path}:{query_items}"
            cached = cache_store.get(cache_key)
            if cached:
                cached_data, etag = cached
                headers = {
                    "ETag": etag,
                    "Cache-Control": f"public, max-age={ttl_seconds}, stale-while-revalidate={ttl_seconds * 2}",
                    "Vary": "Accept-Encoding",
                    "X-Cache": "HIT",
                }
                if request.headers.get("if-none-match", "").strip() == etag:
                    return Response(status_code=304, headers=headers)
                return JSONResponse(content=cached_data, headers=headers)

            result = await func(*args, **kwargs)
            try:
                from fastapi.encoders import jsonable_encoder

                if hasattr(result, "model_dump"):
                    serializable = result.model_dump(mode="json")
                elif isinstance(result, list):
                    serializable = [
                        item.model_dump(mode="json") if hasattr(item, "model_dump") else item
                        for item in result
                    ]
                else:
                    serializable = jsonable_encoder(result)

                etag = cache_store.set(cache_key, serializable, ttl_seconds=ttl_seconds)
                return JSONResponse(
                    content=serializable,
                    headers={
                        "ETag": etag,
                        "Cache-Control": f"public, max-age={ttl_seconds}, stale-while-revalidate={ttl_seconds * 2}",
                        "Vary": "Accept-Encoding",
                        "X-Cache": "MISS",
                    },
                )
            except (TypeError, ValueError):
                return result
        return wrapper
    return decorator
