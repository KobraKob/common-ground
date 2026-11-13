import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.modules.identity.models import User, StudentProfile
from app.modules.commons.models import Post
from app.modules.colleges.models import College
from app.modules.communities.models import Community
from app.modules.projects.models import Project


@pytest.mark.asyncio
async def test_performance_monitoring_and_headers(client: AsyncClient):
    # Test health check receives performance timing headers
    res = await client.get("/health")
    assert res.status_code == 200
    assert "x-response-time" in res.headers
    assert "server-timing" in res.headers

    # Test metrics endpoint
    metrics_res = await client.get("/api/v1/system/metrics")
    assert metrics_res.status_code == 200
    data = metrics_res.json()
    assert "total_requests" in data
    assert data["total_requests"] >= 1
    assert "bottlenecks" in data
    assert "uptime_seconds" in data


@pytest.mark.asyncio
async def test_api_caching_and_etag_on_colleges(client: AsyncClient, db_session):
    # Setup test college
    c = College(
        id="col-perf-1",
        name="Performance Institute of Tech",
        slug="pit-blr",
        short_name="PIT",
        city="Bengaluru",
        state="Karnataka",
        is_active_cluster=True,
    )
    db_session.add(c)
    await db_session.commit()

    # Initial request (miss)
    res1 = await client.get("/api/v1/colleges")
    assert res1.status_code == 200
    assert "etag" in res1.headers
    assert "cache-control" in res1.headers
    etag = res1.headers["etag"]

    # Second request with If-None-Match (304 Not Modified)
    res2 = await client.get("/api/v1/colleges", headers={"if-none-match": etag})
    assert res2.status_code == 304

    # Second request without If-None-Match (cache hit)
    res3 = await client.get("/api/v1/colleges")
    assert res3.status_code == 200
    assert res3.headers.get("x-cache") == "HIT"


@pytest.mark.asyncio
async def test_pagination_on_posts(client: AsyncClient, db_session):
    u = User(id="user-pag-1", email="paguser@test.com")
    db_session.add(u)
    prof = StudentProfile(user_id="user-pag-1", handle="pag_user", display_name="Pag User")
    db_session.add(prof)

    # Seed 5 posts
    for i in range(5):
        p = Post(
            id=f"post-pag-{i}",
            author_id="user-pag-1",
            category="DISCUSSION",
            title=f"Post {i}",
            body=f"Content for post {i}",
            is_cross_campus=True,
        )
        db_session.add(p)
    await db_session.commit()

    # Fetch page 1 (limit 2, offset 0)
    page1 = await client.get("/api/v1/posts?scope=city&limit=2&offset=0")
    assert page1.status_code == 200
    assert len(page1.json()) == 2
    assert page1.headers.get("x-total-count") is not None
    assert int(page1.headers.get("x-total-count")) >= 5
    assert page1.headers.get("x-has-more") == "true"
    assert page1.headers.get("x-offset") == "0"
    assert page1.headers.get("x-limit") == "2"

    # Fetch page 2 (limit 2, offset 2)
    page2 = await client.get("/api/v1/posts?scope=city&limit=2&offset=2")
    assert page2.status_code == 200
    assert len(page2.json()) == 2
    assert page2.headers.get("x-offset") == "2"

    # Fetch past end
    page_end = await client.get("/api/v1/posts?scope=city&limit=10&offset=100")
    assert page_end.status_code == 200
    assert len(page_end.json()) == 0
    assert page_end.headers.get("x-has-more") == "false"


@pytest.mark.asyncio
async def test_pagination_on_projects_and_communities(client: AsyncClient, db_session):
    u = User(id="user-pag-2", email="paguser2@test.com")
    db_session.add(u)
    await db_session.commit()

    # Seed 3 projects
    for i in range(3):
        proj = Project(
            id=f"proj-pag-{i}",
            creator_id="user-pag-2",
            title=f"Project {i}",
            pitch=f"Pitch {i}",
            description="Testing pagination",
            stage="BUILDING",
        )
        db_session.add(proj)

    # Seed 3 communities
    for i in range(3):
        comm = Community(
            id=f"comm-pag-{i}",
            name=f"Community {i}",
            slug=f"comm-pag-{i}",
            description="Testing pagination",
            community_type="GENERAL",
            visibility="PUBLIC",
        )
        db_session.add(comm)
    await db_session.commit()

    # Check projects pagination
    proj_res = await client.get("/api/v1/projects?limit=2&offset=0")
    assert proj_res.status_code == 200
    assert len(proj_res.json()) == 2
    assert proj_res.headers.get("x-has-more") == "true"

    # Check communities pagination
    comm_res = await client.get("/api/v1/communities?limit=2&offset=0")
    assert comm_res.status_code == 200
    assert len(comm_res.json()) == 2
    assert comm_res.headers.get("x-has-more") == "true"
