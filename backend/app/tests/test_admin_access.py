import pytest


@pytest.mark.asyncio
async def test_private_passport_requires_authentication(client):
    response = await client.get("/api/v1/me/passport")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_platform_analytics_requires_authentication(client):
    response = await client.get("/api/v1/analytics/overview")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_performance_metrics_requires_authentication(client):
    response = await client.get("/api/v1/system/admin/metrics")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_project_workspace_tasks_require_authentication(client):
    response = await client.get("/api/v1/projects/00000000-0000-0000-0000-000000000000/tasks")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_moderation_audit_requires_authentication(client):
    response = await client.get("/api/v1/moderation/audit")
    assert response.status_code == 401
