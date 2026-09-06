# Cloudflare Tunnel (public demo access)

Ash's signaling server listens only on localhost. To expose it publicly during a
hackathon without opening an inbound firewall port, run an outgoing-only
Cloudflare Tunnel.

## Option A — Quick Tunnel (no account, no config)

```sh
cloudflared tunnel --url http://localhost:8000
```

Prints a `https://<random>.trycloudflare.com` URL you can share. Point the
frontend at that URL. No config file, no Cloudflare account, no DNS.

## Option B — Named tunnel (persistent URL)

1. `cloudflared tunnel login` — one-time, opens a browser to authorize.
2. `cloudflared tunnel create ash` — creates a tunnel; note the `<TUNNEL_ID>`.
3. Copy `config.example.yml` → `config.yml` and replace `YOUR_UUID_UUID`
   with `<TUNNEL_ID>` (also update the hostname in `ingress`).
4. `cloudflared tunnel route dns ash your-domain.example.com`.
5. Run with the compose service (set `TUNNEL_TOKEN`) or:
   ```sh
   cloudflared tunnel --config config.yml run ash
   ```

## What the tunnel sees

The tunnel (and Cloudflare) can observe connection-level metadata: timing, IPs,
which host connected. It **cannot** see chat content — E2EE happens in the
browser before the payload reaches the network.

## Caveats

- The tunnel is **not** the privacy boundary. Application-layer encryption is.
- If a tunnel is used, source-IP rate limiting (`ASH_ROOMS_PER_MINUTE`) keys off
  the tunnel-provided `x-forwarded-for`; set Cloudflare to forward the real IP.
