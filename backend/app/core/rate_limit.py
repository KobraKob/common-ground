import time
from typing import Dict, Tuple
from fastapi import HTTPException, status, Request


class InMemoryRateLimiter:
    """Lightweight in-memory sliding window rate limiter."""
    def __init__(self):
        # Key: (client_identifier, action) -> list of timestamps
        self.requests: Dict[Tuple[str, str], list] = {}

    def check_limit(self, identifier: str, action: str, max_requests: int, window_seconds: int):
        now = time.time()
        key = (identifier, action)
        if key not in self.requests:
            self.requests[key] = []

        # Filter out timestamps older than window
        self.requests[key] = [t for t in self.requests[key] if now - t < window_seconds]

        if len(self.requests[key]) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for {action}. Please try again shortly.",
            )

        self.requests[key].append(now)


rate_limiter = InMemoryRateLimiter()


def limit_action(action: str, max_requests: int = 30, window_seconds: int = 60):
    async def dependency(request: Request):
        client_ip = request.client.host if request.client else "unknown"
        rate_limiter.check_limit(client_ip, action, max_requests, window_seconds)
    return dependency
