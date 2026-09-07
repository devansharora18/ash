# ash

Disposable, end-to-end encrypted P2P chat. No accounts, no message history, no central database — a room exists only in memory while at least one peer is connected, then evaporates.

## How it works

A lightweight **signaling server** brokers peer discovery and WebRTC handshakes. Once peers connect, chat flows directly between browsers over a **WebRTC DataChannel** (full mesh) — the server never sees message content. Encryption happens client-side with libsodium (X25519 key exchange, XSalsa20-Poly1305 `crypto_secretbox`, Ed25519 signatures).

```
Peer A ──HTTPS/WSS──> Cloudflare Tunnel ──> Signaling Server <── Peer B
   │                                                              │
   └────────────── WebRTC DataChannel (direct, E2EE) ─────────────┘
```

The tunnel (and any observer) sees only connection metadata, never plaintext.

## Repository layout

| Path | What |
|------|------|
| `server/` | FastAPI signaling server (Python, in-memory state, no DB) |
| `apps/web/` | Web client — React + Vite + TypeScript + Tailwind v4 |
| `apps/mobile/` | Mobile client — Flutter |
| `apps/desktop/` | "Ash Deploy" tool — Dioxus (Rust). One-click connect your server to a Cloudflare hostname |
| `docs/` | Architecture diagrams, `protocol.md`, project documentation PDF |

## Getting started

### Signaling server

```sh
cd server
python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8000
```

Or via Docker:

```sh
docker compose up signaling
```

Verify with `curl http://localhost:8000/health` → `{"status":"ok"}`.

### Web client

```sh
cd apps/web
npm install
npm run dev      # Vite dev server on :5173
npm run build    # production build
```

### Mobile client

```sh
cd apps/mobile
flutter run
```

### Desktop deploy tool ("Ash Deploy")

Brings your signaling server online under a Cloudflare subdomain in one click:

```sh
cd apps/desktop
cargo run
```

Steps: health-check your backend → detect `cloudflared tunnel login` → create/route a named tunnel → run it → show the public `https://` URL. It downloads the `cloudflared` binary on first run. `Stop`/`Teardown` give you full lifecycle control.

## Exposing publicly (Cloudflare Tunnel)

Two options:

1. **Desktop app** (recommended) — handles the tunnel end-to-end.
2. **Manual** — `cloudflared tunnel --url http://localhost:8000` for a quick tunnel, or the compose `tunnel` service for a persistent named tunnel (set `TUNNEL_TOKEN` in `.env`).

The tunnel is not the privacy boundary — application-layer encryption is.

## Configuration

The server reads `ASH_*` environment variables (see `docs/protocol.md` for the full table):

| Env var | Default | Description |
|---------|---------|-------------|
| `ASH_PORT` | `8000` | Bind port |
| `ASH_ROOM_TTL_SECONDS` | `3600` | Evict idle rooms after this long |
| `ASH_MAX_ROOM_SIZE` | `5` | Max peers per room |
| `ASH_MAX_MESSAGE_BYTES` | `65536` | Max WS message size |
| `ASH_ROOMS_PER_MINUTE` | `30` | Room-creation rate limit per IP |
| `ASH_ALLOWED_ORIGINS` | local Vite/Preview URLs | CORS allowlist |

## Tests

```sh
# server
cd server && .venv/bin/pytest

# web
cd apps/web && npm run lint && npm run build

# mobile
cd apps/mobile && flutter test

# desktop
cd apps/desktop && cargo test && cargo clippy
```

## Signal protocol

The full signaling protocol — endpoints, WebSocket message and close-code reference, and security notes — is documented in [`docs/protocol.md`](docs/protocol.md).

## Status / known limitations

- The signaling server is fully implemented (in-memory, single-process — scale horizontally only by running one instance, since room state is not shared).
- The web and mobile clients are UI-complete; real WebRTC, signaling, and crypto wiring are still in progress.
- Room state is intentionally ephemeral: nothing is written to disk, so there is nothing to retain or leak.

## License

[GPL-3.0](LICENSE)
