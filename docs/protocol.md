# Ash Signaling Protocol

Ephemeral signaling for disposable P2P rooms. The server never sees or carries chat messages — it only relays WebRTC handshake data and room lifecycle events. Transport is JSON over HTTP and WebSocket.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness probe. Returns `{"status":"ok"}`. |
| `POST` | `/rooms` | Create a room. Returns `{"room_id","link"}`. Rate limited to `ASH_ROOMS_PER_MINUTE` (default 30/min per IP). |
| `WS` | `/ws/{room_id}?peer_id={id}` | Signaling channel for a room. |

## Room lifecycle

```
Client A                          Server                          Client B
   |  POST /rooms                    |                                |
   |-------------------------------->|  generate room_id              |
   |<--------------------------------|  {"room_id","link"}            |
   |  share link out-of-band         |                                |
   |----------------------------------------------------------------->|
   |                                 |  WS /ws/{room_id}?peer_id=B    |
   |                                 |<-------------------------------|
   |  WS /ws/{room_id}?peer_id=A    |  welcome + peer-joined          |
   |-------------------------------->|                                |
   |<--------------------------------|-------------------------------> |
   |  <-- SDP / ICE relay via signal messages -->                     |
   |  <========== WebRTC DataChannel (direct, not via server) ======>|
   |  WS close / leave               |  remove peer, peer-left        |
```

Empty rooms are deleted immediately. Idle rooms are evicted after `ASH_ROOM_TTL_SECONDS` (default 3600s) of no `signal`/`join` activity; remaining peers are closed with `4408 room expired`.

## WebSocket handshake

Query params:

| Param | Type | Constraints |
|-------|------|-------------|
| `peer_id` | string | 1–64 chars, unique within the room |

Close codes (server-initiated):

| Code | Reason | When |
|------|--------|------|
| `4404` | room not found | Unknown `room_id` |
| `4400` | invalid peer id | Empty or >64 chars |
| `4409` | peer id already in use | Duplicate `peer_id` in room |
| `4409` | room full | Room at `max_room_size` (default 5) |
| `4408` | room expired | TTL eviction |

All rejections happen after `accept()` so the client receives a proper close frame.

## Messages

All messages are JSON objects with a `type` field. Max size `ASH_MAX_MESSAGE_BYTES` (default 65536). Invalid JSON, oversized payloads, non-object messages, and unknown `signal` targets receive an `error` response and do not close the connection. Unknown `type` values are ignored.

### Server → client

| Type | Shape | When |
|------|-------|------|
| `welcome` | `{"type":"welcome","peer_id":string,"peers":string[]}` | Sent to the joining peer. `peers` lists existing peer IDs. |
| `peer-joined` | `{"type":"peer-joined","peer_id":string}` | Broadcast to existing peers when someone joins. |
| `peer-left` | `{"type":"peer-left","peer_id":string}` | Broadcast when someone leaves or disconnects. |
| `signal` | `{"type":"signal","from":string,"data":any}` | Relayed SDP/ICE payload from another peer. `data` is opaque to the server. |
| `error` | `{"type":"error","message":string}` | Validation failure. Messages: `invalid json`, `invalid message`, `message too large`, `unknown target`, `room full`. |

### Client → server

| Type | Shape | Description |
|------|-------|-------------|
| `signal` | `{"type":"signal","to":string,"data":any}` | Relay `data` to peer `to`. `to` must be a connected peer ID. |
| `leave` | `{"type":"leave"}` | Voluntary leave. Server removes the peer and broadcasts `peer-left`. |

No other client message types are handled. Disconnecting without `leave` is treated identically via `WebSocketDisconnect`.

## Examples

Create a room:

```sh
curl -X POST http://localhost:8000/rooms
# {"room_id":"8oJtCvIROEw","link":"/?room=8oJtCvIROEw"}
```

Join and relay (JS):

```js
const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}?peer_id=${myId}`);
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === "welcome") console.log("existing peers", msg.peers);
  if (msg.type === "peer-joined") console.log("joined", msg.peer_id);
  if (msg.type === "signal") handleSignal(msg.from, msg.data);
};
// send offer/ICE to peer B
ws.send(JSON.stringify({ type: "signal", to: "B", data: { sdp: "..." } }));
```

## Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| `ASH_HOST` | `0.0.0.0` | Bind address |
| `ASH_PORT` | `8000` | Bind port |
| `ASH_ROOM_TTL_SECONDS` | `3600` | Idle TTL before eviction |
| `ASH_CLEANUP_INTERVAL_SECONDS` | `60` | Sweep interval |
| `ASH_MAX_ROOM_SIZE` | `5` | Max peers per room |
| `ASH_MAX_MESSAGE_BYTES` | `65536` | Max WS message size |
| `ASH_MAX_PEER_ID_LENGTH` | `64` | Max peer ID length |
| `ASH_ROOMS_PER_MINUTE` | `30` | Rate limit per IP |
| `ASH_ALLOWED_ORIGINS` | `["http://localhost:5173","http://localhost:4173"]` | CORS allowlist |

## Security notes

- The server logs only lifecycle metadata (`room created`, `peer joined/left` with IDs). Message payloads are never logged.
- All client-supplied JSON is validated; oversized or malformed messages are rejected with `error` without closing the connection.
- Rate limiting keys on `x-forwarded-for` (first hop) falling back to socket IP — configure the tunnel/proxy to forward the real client IP.
