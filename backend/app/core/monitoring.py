import time
import logging
from typing import Dict, Any, List
from collections import defaultdict, deque
from fastapi import Request, Response, APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.modules.identity.models import User
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("commonground.monitoring")


class MetricsTracker:
    def __init__(self):
        self.start_time = time.time()
        self.total_requests = 0
        self.total_errors = 0
        self.slow_requests_count = 0
        self.route_latencies: Dict[str, List[float]] = defaultdict(list)
        self.route_counts: Dict[str, int] = defaultdict(int)
        self.route_errors: Dict[str, int] = defaultdict(int)
        self.recent_slow_requests = deque(maxlen=50)

    def record_request(self, method: str, route: str, status_code: int, duration_ms: float):
        self.total_requests += 1
        key = f"{method} {route}"
        self.route_counts[key] += 1

        # Keep rolling window of last 100 latencies per route
        latencies = self.route_latencies[key]
        if len(latencies) >= 100:
            latencies.pop(0)
        latencies.append(duration_ms)

        if status_code >= 400:
            self.total_errors += 1
            self.route_errors[key] += 1

        if duration_ms > 150.0:
            self.slow_requests_count += 1
            self.recent_slow_requests.append({
                "timestamp": time.time(),
                "route": key,
                "status_code": status_code,
                "duration_ms": round(duration_ms, 2),
            })
            if duration_ms > 300.0:
                logger.warning(f"[Bottleneck Alert] {key} took {duration_ms:.2f}ms (Status: {status_code})")

    def get_summary(self) -> Dict[str, Any]:
        uptime_seconds = time.time() - self.start_time
        route_stats = {}
        slowest_routes = []

        for route, lats in self.route_latencies.items():
            if not lats:
                continue
            sorted_lats = sorted(lats)
            avg_ms = sum(lats) / len(lats)
            p95_idx = int(len(sorted_lats) * 0.95)
            p95_ms = sorted_lats[min(p95_idx, len(sorted_lats) - 1)]
            max_ms = sorted_lats[-1]
            min_ms = sorted_lats[0]
            count = self.route_counts[route]
            errors = self.route_errors.get(route, 0)

            stats = {
                "calls": count,
                "errors": errors,
                "avg_ms": round(avg_ms, 2),
                "min_ms": round(min_ms, 2),
                "max_ms": round(max_ms, 2),
                "p95_ms": round(p95_ms, 2),
                "total_time_ms": round(avg_ms * count, 2),
            }
            route_stats[route] = stats
            slowest_routes.append({"route": route, **stats})

        slowest_routes.sort(key=lambda x: x["avg_ms"], reverse=True)

        return {
            "uptime_seconds": round(uptime_seconds, 1),
            "total_requests": self.total_requests,
            "total_errors": self.total_errors,
            "slow_requests_count": self.slow_requests_count,
            "error_rate_pct": round((self.total_errors / self.total_requests * 100), 2) if self.total_requests > 0 else 0.0,
            "bottlenecks": slowest_routes[:5],
            "routes": route_stats,
            "recent_slow_requests": list(self.recent_slow_requests),
        }

    def reset(self):
        self.start_time = time.time()
        self.total_requests = 0
        self.total_errors = 0
        self.slow_requests_count = 0
        self.route_latencies.clear()
        self.route_counts.clear()
        self.route_errors.clear()
        self.recent_slow_requests.clear()


metrics_tracker = MetricsTracker()


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Normalize route path to avoid exploding keys with variable UUIDs
        path = request.url.path
        start_time = time.perf_counter()

        try:
            response: Response = await call_next(request)
        except Exception:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            metrics_tracker.record_request(request.method, path, 500, duration_ms)
            raise

        duration_ms = (time.perf_counter() - start_time) * 1000.0
        route = request.scope.get("route")
        metric_path = getattr(route, "path", path)
        metrics_tracker.record_request(request.method, metric_path, response.status_code, duration_ms)

        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"
        response.headers["Server-Timing"] = f"app;dur={duration_ms:.2f};desc=\"FastAPI processing\""

        return response


monitoring_router = APIRouter(prefix="/system", tags=["Monitoring & Performance"])


async def require_moderator(user: User = Depends(get_current_user)) -> User:
    if user.platform_role not in {"ADMIN", "MODERATOR"}:
        raise HTTPException(status_code=403, detail="Monitoring access is restricted to moderators")
    return user


@monitoring_router.get("/metrics")
async def get_performance_metrics(user: User = Depends(require_moderator)):
    """Retrieve runtime performance telemetry, latency percentiles, and bottleneck identification."""
    return metrics_tracker.get_summary()


@monitoring_router.post("/metrics/reset")
async def reset_performance_metrics(user: User = Depends(require_moderator)):
    """Reset telemetry tracking."""
    metrics_tracker.reset()
    return {"message": "Metrics reset successfully"}
