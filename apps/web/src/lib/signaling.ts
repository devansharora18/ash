export interface ChatPayload {
  kind: 'chat'
  text: string
}

export type ServerMessage =
  | { type: 'welcome'; peer_id: string; peers: string[] }
  | { type: 'peer-joined'; peer_id: string }
  | { type: 'peer-left'; peer_id: string }
  | { type: 'signal'; from: string; data: unknown }
  | { type: 'error'; message: string }

export interface CreateRoomResult {
  roomId: string
  link: string
}

export async function createRoom(
  backendUrl: string,
): Promise<CreateRoomResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${backendUrl}/rooms`, {
      method: 'POST',
      signal: controller.signal,
    })
    if (!res.ok) {
      const detail = (await res.json().catch(() => null)) as
        | { detail?: string }
        | null
      throw new Error(detail?.detail ?? `HTTP ${res.status}`)
    }
    const body = (await res.json()) as { room_id: string; link: string }
    return { roomId: body.room_id, link: body.link }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

function wsUrl(backendUrl: string, roomId: string, peerId: string): string {
  const url = new URL(backendUrl)
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${url.host}/ws/${encodeURIComponent(roomId)}?peer_id=${encodeURIComponent(peerId)}`
}

interface SignalingOptions {
  backendUrl: string
  roomId: string
  peerId: string
  onMessage: (message: ServerMessage) => void
  onClose: (code: number, reason: string) => void
}

export interface SignalingConnection {
  send: (to: string, data: unknown) => void
  close: () => void
}

export function connectSignaling(
  options: SignalingOptions,
): SignalingConnection {
  const ws = new WebSocket(wsUrl(options.backendUrl, options.roomId, options.peerId))

  ws.onmessage = (event) => {
    try {
      options.onMessage(JSON.parse(event.data as string) as ServerMessage)
    } catch {
      // ignore malformed frames
    }
  }

  ws.onclose = (event) => {
    options.onClose(event.code, event.reason)
  }

  return {
    send(to, data) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'signal', to, data }))
      }
    },
    close() {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        try {
          ws.send(JSON.stringify({ type: 'leave' }))
        } catch {
          // ignore
        }
        ws.close()
      }
    },
  }
}
