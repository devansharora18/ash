from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.signaling import room_limiter

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_rooms_create_and_rate_limit():
    room_limiter._hits.clear()

    for _ in range(settings.rooms_per_minute):
        assert client.post("/rooms").status_code == 200

    over = client.post("/rooms")
    assert over.status_code == 429
    room_limiter._hits.clear()


def test_signal_relay_and_leave():
    room_id = client.post("/rooms").json()["room_id"]

    with client.websocket_connect(f"/ws/{room_id}?peer_id=A") as a, \
            client.websocket_connect(f"/ws/{room_id}?peer_id=B") as b:
        assert a.receive_json() == {"type": "welcome", "peer_id": "A", "peers": []}
        assert b.receive_json() == {"type": "welcome", "peer_id": "B", "peers": ["A"]}
        assert a.receive_json() == {"type": "peer-joined", "peer_id": "B"}

        a.send_json({"type": "signal", "to": "B", "data": {"sdp": "x"}})
        assert b.receive_json() == {"type": "signal", "from": "A", "data": {"sdp": "x"}}

        a.send_json({"type": "leave"})
        assert b.receive_json() == {"type": "peer-left", "peer_id": "A"}


def test_signal_validation_errors():
    room_id = client.post("/rooms").json()["room_id"]
    with client.websocket_connect(f"/ws/{room_id}?peer_id=A") as a:
        assert a.receive_json()["type"] == "welcome"

        a.send_text("not-json{{{")
        assert a.receive_json() == {"type": "error", "message": "invalid json"}

        a.send_json({"type": "signal", "to": "nope", "data": {}})
        assert a.receive_json() == {"type": "error", "message": "unknown target"}

        a.send_json([1, 2, 3])
        assert a.receive_json() == {"type": "error", "message": "invalid message"}


def _close_code(ws):
    msg = ws.receive()
    assert msg["type"] == "websocket.close"
    return msg["code"]


def test_websocket_rejection_codes():
    with client.websocket_connect("/ws/nope?peer_id=A") as ws:
        assert _close_code(ws) == 4404

    room_id = client.post("/rooms").json()["room_id"]

    with client.websocket_connect(f"/ws/{room_id}?peer_id=%20") as ws:
        assert _close_code(ws) == 4400

    with client.websocket_connect(f"/ws/{room_id}?peer_id=A") as a:
        assert a.receive_json()["type"] == "welcome"
        with client.websocket_connect(f"/ws/{room_id}?peer_id=A") as dup:
            assert _close_code(dup) == 4409
