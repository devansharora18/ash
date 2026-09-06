import time

import pytest

from app.rooms import Peer, Room


class _FakeWS:
    def __init__(self):
        self.closed = []

    async def close(self, code=1000, reason=""):
        self.closed.append((code, reason))


def test_create_assigns_unique_ids(isolated_manager):
    a = isolated_manager.create()
    b = isolated_manager.create()
    assert a.id != b.id
    assert isolated_manager.get(a.id) is a


def test_add_peer_enforces_max_size(isolated_manager):
    room = isolated_manager.create()
    for i in range(5):
        assert isolated_manager.add_peer(room, Peer(id=f"p{i}", websocket=_FakeWS()))
    assert not isolated_manager.add_peer(room, Peer(id="overflow", websocket=_FakeWS()))


def test_remove_peer_deletes_empty_room(isolated_manager):
    room = isolated_manager.create()
    isolated_manager.add_peer(room, Peer(id="a", websocket=_FakeWS()))
    isolated_manager.remove_peer(room, "a")
    assert isolated_manager.get(room.id) is None


def test_peers_exclude(isolated_manager):
    room = isolated_manager.create()
    isolated_manager.add_peer(room, Peer(id="a", websocket=_FakeWS()))
    isolated_manager.add_peer(room, Peer(id="b", websocket=_FakeWS()))
    assert [p.id for p in isolated_manager.peers(room, exclude="a")] == ["b"]


@pytest.mark.asyncio
async def test_cleanup_evicts_idle_and_closes_sockets(isolated_manager):
    room = isolated_manager.create()
    ws = _FakeWS()
    isolated_manager.add_peer(room, Peer(id="a", websocket=ws))
    isolated_manager._ttl = -1
    await isolated_manager.cleanup()
    assert isolated_manager.get(room.id) is None
    assert ws.closed == [(4408, "room expired")]


@pytest.mark.asyncio
async def test_cleanup_keeps_active_room(isolated_manager):
    room = isolated_manager.create()
    ws = _FakeWS()
    isolated_manager.add_peer(room, Peer(id="a", websocket=ws))
    isolated_manager._ttl = 60
    await isolated_manager.cleanup()
    assert isolated_manager.get(room.id) is room
    assert ws.closed == []
