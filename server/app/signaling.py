import json
import logging

from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect

from .config import settings
from .ratelimit import SlidingWindowLimiter
from .rooms import Peer, RoomManager

logger = logging.getLogger(__name__)

manager = RoomManager(settings.room_ttl_seconds, settings.max_room_size)
room_limiter = SlidingWindowLimiter(settings.rooms_per_minute)

router = APIRouter()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/rooms")
def create_room(request: Request) -> dict:
    ip = _client_ip(request)
    if not room_limiter.allow(ip):
        logger.warning("rate limit exceeded", extra={"ip": ip})
        raise HTTPException(status_code=429, detail="too many rooms")
    room = manager.create()
    logger.info("room created", extra={"room_id": room.id})
    return {"room_id": room.id, "link": f"/?room={room.id}"}


@router.websocket("/ws/{room_id}")
async def signaling(websocket: WebSocket, room_id: str, peer_id: str) -> None:
    await websocket.accept()

    room = manager.get(room_id)
    if room is None:
        await websocket.close(code=4404, reason="room not found")
        return

    peer_id = peer_id.strip()
    if not peer_id or len(peer_id) > settings.max_peer_id_length:
        await websocket.close(code=4400, reason="invalid peer id")
        return
    if peer_id in room.peers:
        await websocket.close(code=4409, reason="peer id already in use")
        return

    peer = Peer(id=peer_id, websocket=websocket)
    if not manager.add_peer(room, peer):
        await websocket.send_json({"type": "error", "message": "room full"})
        await websocket.close(code=4409, reason="room full")
        return

    manager.touch(room)
    logger.info("peer joined", extra={"room_id": room_id, "peer_id": peer_id})

    try:
        existing = [p.id for p in manager.peers(room, exclude=peer_id)]
        await websocket.send_json({"type": "welcome", "peer_id": peer_id, "peers": existing})

        for p in manager.peers(room, exclude=peer_id):
            await p.websocket.send_json({"type": "peer-joined", "peer_id": peer_id})

        while True:
            raw = await websocket.receive_text()
            if len(raw) > settings.max_message_bytes:
                await websocket.send_json({"type": "error", "message": "message too large"})
                continue

            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "invalid json"})
                continue

            if not isinstance(message, dict):
                await websocket.send_json({"type": "error", "message": "invalid message"})
                continue

            mtype = message.get("type")

            if mtype == "signal":
                target_id = message.get("to")
                if not isinstance(target_id, str) or target_id not in room.peers:
                    await websocket.send_json({"type": "error", "message": "unknown target"})
                    continue
                await room.peers[target_id].websocket.send_json(
                    {
                        "type": "signal",
                        "from": peer_id,
                        "data": message.get("data"),
                    }
                )
                manager.touch(room)
            elif mtype == "leave":
                break

    except WebSocketDisconnect:
        pass
    finally:
        manager.remove_peer(room, peer_id)
        logger.info("peer left", extra={"room_id": room_id, "peer_id": peer_id})
        for p in manager.peers(room):
            await p.websocket.send_json({"type": "peer-left", "peer_id": peer_id})
