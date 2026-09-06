import secrets
import time
from dataclasses import dataclass, field

from fastapi import WebSocket


@dataclass
class Peer:
    id: str
    websocket: WebSocket


@dataclass
class Room:
    id: str
    created_at: float = field(default_factory=time.time)
    peers: dict[str, Peer] = field(default_factory=dict)


class RoomManager:
    def __init__(self, ttl_seconds: int, max_room_size: int) -> None:
        self._rooms: dict[str, Room] = {}
        self._ttl = ttl_seconds
        self._max_room_size = max_room_size

    def create(self) -> Room:
        room = Room(id=secrets.token_urlsafe(8))
        self._rooms[room.id] = room
        return room

    def get(self, room_id: str) -> Room | None:
        return self._rooms.get(room_id)

    def add_peer(self, room: Room, peer: Peer) -> bool:
        if len(room.peers) >= self._max_room_size:
            return False
        room.peers[peer.id] = peer
        return True

    def remove_peer(self, room: Room, peer_id: str) -> None:
        room.peers.pop(peer_id, None)
        if not room.peers:
            self._rooms.pop(room.id, None)

    def peers(self, room: Room, exclude: str | None = None) -> list[Peer]:
        return [p for pid, p in room.peers.items() if pid != exclude]

    def cleanup(self) -> None:
        now = time.time()
        expired = [rid for rid, r in self._rooms.items() if now - r.created_at > self._ttl]
        for rid in expired:
            self._rooms.pop(rid, None)
