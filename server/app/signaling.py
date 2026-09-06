import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .config import settings
from .rooms import Peer, RoomManager

manager = RoomManager(settings.room_ttl_seconds, settings.max_room_size)

router = APIRouter()


@router.post("/rooms")
def create_room() -> dict:
    room = manager.create()
    return {"room_id": room.id, "link": f"/?room={room.id}"}


@router.websocket("/ws/{room_id}")
async def signaling(websocket: WebSocket, room_id: str, peer_id: str) -> None:
    room = manager.get(room_id)
    if room is None:
        await websocket.close(code=4404)
        return

    await websocket.accept()
    peer = Peer(id=peer_id, websocket=websocket)
    if not manager.add_peer(room, peer):
        await websocket.send_json({"type": "error", "message": "room full"})
        await websocket.close()
        return

    try:
        existing = [p.id for p in manager.peers(room, exclude=peer_id)]
        await websocket.send_json({"type": "welcome", "peer_id": peer_id, "peers": existing})

        for p in manager.peers(room, exclude=peer_id):
            await p.websocket.send_json({"type": "peer-joined", "peer_id": peer_id})

        while True:
            raw = await websocket.receive_text()
            message = json.loads(raw)
            mtype = message.get("type")

            if mtype == "signal":
                target = room.peers.get(message.get("to"))
                if target is not None:
                    await target.websocket.send_json(
                        {
                            "type": "signal",
                            "from": peer_id,
                            "data": message.get("data"),
                        }
                    )
            elif mtype == "leave":
                break

    except WebSocketDisconnect:
        pass
    finally:
        manager.remove_peer(room, peer_id)
        for p in manager.peers(room):
            await p.websocket.send_json({"type": "peer-left", "peer_id": peer_id})
