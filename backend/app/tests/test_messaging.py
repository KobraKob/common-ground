import pytest
from httpx import AsyncClient

from app.modules.identity.models import StudentProfile, User, UserBlock


@pytest.mark.asyncio
async def test_direct_messaging_is_private_and_idempotent(client: AsyncClient, db_session):
    sender = User(id="message-sender", email="sender@messages.test")
    recipient = User(id="message-recipient", email="recipient@messages.test")
    stranger = User(id="message-stranger", email="stranger@messages.test")
    db_session.add_all([sender, recipient, stranger])
    db_session.add_all([
        StudentProfile(
            user_id=sender.id,
            handle="messagesender",
            display_name="Message Sender",
            profile_visibility="PUBLIC",
            dm_permission="EVERYONE",
        ),
        StudentProfile(
            user_id=recipient.id,
            handle="messagerecipient",
            display_name="Message Recipient",
            profile_visibility="PUBLIC",
            dm_permission="EVERYONE",
        ),
        StudentProfile(
            user_id=stranger.id,
            handle="messagestrange",
            display_name="Message Stranger",
            profile_visibility="PUBLIC",
            dm_permission="EVERYONE",
        ),
    ])
    await db_session.commit()

    created = await client.post(
        "/api/v1/conversations/direct",
        json={"target_user_id": recipient.id},
        headers={"X-User-Id": sender.id},
    )
    assert created.status_code == 201
    conversation_id = created.json()["id"]
    assert created.json()["title"] == "Message Recipient"

    repeated = await client.post(
        "/api/v1/conversations/direct",
        json={"target_user_id": recipient.id},
        headers={"X-User-Id": sender.id},
    )
    assert repeated.status_code == 201
    assert repeated.json()["id"] == conversation_id

    sent = await client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        json={"body": "Could you review my project portfolio?"},
        headers={"X-User-Id": sender.id},
    )
    assert sent.status_code == 201
    assert sent.json()["sender_name"] == "Message Sender"
    assert "email" not in sent.json()

    recipient_inbox = await client.get(
        "/api/v1/conversations",
        headers={"X-User-Id": recipient.id},
    )
    assert recipient_inbox.status_code == 200
    assert recipient_inbox.json()[0]["last_message"] == "Could you review my project portfolio?"

    recipient_messages = await client.get(
        f"/api/v1/conversations/{conversation_id}/messages?limit=50&offset=0",
        headers={"X-User-Id": recipient.id},
    )
    assert recipient_messages.status_code == 200
    assert recipient_messages.headers["x-total-count"] == "1"
    assert recipient_messages.json()[0]["body"] == "Could you review my project portfolio?"

    stranger_messages = await client.get(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"X-User-Id": stranger.id},
    )
    assert stranger_messages.status_code == 404


@pytest.mark.asyncio
async def test_direct_messaging_respects_blocks_and_contact_permissions(client: AsyncClient, db_session):
    requester = User(id="blocked-requester", email="requester@messages.test")
    blocked_user = User(id="blocked-target", email="blocked@messages.test")
    restricted_user = User(id="restricted-target", email="restricted@messages.test")
    db_session.add_all([requester, blocked_user, restricted_user])
    db_session.add_all([
        StudentProfile(
            user_id=requester.id,
            handle="blockedrequester",
            display_name="Requester",
            profile_visibility="PUBLIC",
            dm_permission="EVERYONE",
        ),
        StudentProfile(
            user_id=blocked_user.id,
            handle="blockedtarget",
            display_name="Blocked Target",
            profile_visibility="PUBLIC",
            dm_permission="EVERYONE",
        ),
        StudentProfile(
            user_id=restricted_user.id,
            handle="restrictedtarget",
            display_name="Restricted Target",
            profile_visibility="PUBLIC",
            dm_permission="SAME_CAMPUS_OR_COMMUNITY",
        ),
    ])
    db_session.add(UserBlock(blocker_id=blocked_user.id, blocked_id=requester.id))
    await db_session.commit()

    blocked_response = await client.post(
        "/api/v1/conversations/direct",
        json={"target_user_id": blocked_user.id},
        headers={"X-User-Id": requester.id},
    )
    assert blocked_response.status_code == 403

    restricted_response = await client.post(
        "/api/v1/conversations/direct",
        json={"target_user_id": restricted_user.id},
        headers={"X-User-Id": requester.id},
    )
    assert restricted_response.status_code == 403
