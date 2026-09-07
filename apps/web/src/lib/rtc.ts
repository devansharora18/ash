import type { Settings } from './settings'

const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
]

export type SignalSender = (to: string, data: unknown) => void

/** Build the ICE server list: always the STUN fallback, plus optional TURN. */
export function buildIceServers(settings: Settings): RTCIceServer[] {
  const servers: RTCIceServer[] = [...STUN_SERVERS]
  if (settings.turnUrl) {
    servers.push({
      urls: settings.turnUrl,
      username: settings.turnUsername || undefined,
      credential: settings.turnCredential || undefined,
    })
  }
  return servers
}

type RtcSignal =
  | { type: 'offer'; description: RTCSessionDescriptionInit }
  | { type: 'answer'; description: RTCSessionDescriptionInit }
  | { type: 'candidate'; candidate: RTCIceCandidateInit }

interface PeerConn {
  pc: RTCPeerConnection
  channel: RTCDataChannel | null
  connected: boolean
  remoteSet: boolean
  queuedCandidates: RTCIceCandidateInit[]
  outgoing: OutgoingFile | null
  incoming: IncomingFile | null
  pendingOffer: FileOffer | null
}

export interface FileOffer {
  id: string
  name: string
  size: number
  mime: string
}

interface OutgoingFile {
  id: string
  bytes: ArrayBuffer
  seq: number
}

interface IncomingFile {
  id: string
  name: string
  size: number
  parts: ArrayBuffer[]
  received: number
}

export interface MeshCallbacks {
  onMessage: (from: string, text: string) => void
  onConnectionChange: (peerId: string, connected: boolean) => void
  onFileOffer: (from: string, offer: FileOffer) => void
  onFileComplete: (from: string, name: string, bytes: ArrayBuffer) => void
  onFileCancelled: (from: string) => void
}

/**
 * Full-mesh WebRTC DataChannel layer. SDP/ICE ride the signaling relay; chat
 * text flows directly between peers once each DataChannel opens.
 *
 * Offerer/answerer roles are assigned deterministically by peer id so two
 * peers never both send an offer.
 */
export class RtcMesh {
  private conns = new Map<string, PeerConn>()
  private selfId: string
  private sendSignal: SignalSender
  private callbacks: MeshCallbacks
  private iceServers: RTCIceServer[]

  constructor(
    selfId: string,
    sendSignal: SignalSender,
    callbacks: MeshCallbacks,
    iceServers: RTCIceServer[] = STUN_SERVERS,
  ) {
    this.selfId = selfId
    this.sendSignal = sendSignal
    this.callbacks = callbacks
    this.iceServers = iceServers
  }

  addPeer(peerId: string): void {
    if (this.conns.has(peerId)) return
    const pc = new RTCPeerConnection({ iceServers: this.iceServers })
    const conn: PeerConn = {
      pc,
      channel: null,
      connected: false,
      remoteSet: false,
      queuedCandidates: [],
      outgoing: null,
      incoming: null,
      pendingOffer: null,
    }
    this.conns.set(peerId, conn)
    this.bindIce(peerId, pc)
    pc.ondatachannel = (event) => this.attachChannel(peerId, event.channel)

    if (this.selfId < peerId) {
      this.attachChannel(peerId, pc.createDataChannel('chat'))
      void this.negotiateOffer(peerId)
    }
  }

  removePeer(peerId: string): void {
    const conn = this.conns.get(peerId)
    if (conn) {
      conn.pc.close()
      this.conns.delete(peerId)
    }
  }

  private bindIce(peerId: string, pc: RTCPeerConnection): void {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(peerId, {
          type: 'candidate',
          candidate: event.candidate.toJSON(),
        })
      }
    }
    pc.onconnectionstatechange = () => {
      const connected = pc.connectionState === 'connected'
      const conn = this.conns.get(peerId)
      if (conn && conn.connected !== connected) {
        conn.connected = connected
        this.callbacks.onConnectionChange(peerId, connected)
      }
    }
  }

  private attachChannel(peerId: string, channel: RTCDataChannel): void {
    const conn = this.conns.get(peerId)
    if (conn) conn.channel = channel
    channel.onopen = () => this.callbacks.onConnectionChange(peerId, true)
    channel.onclose = () => this.callbacks.onConnectionChange(peerId, false)
    channel.onmessage = (event) => {
      const data = event.data
      if (typeof data === 'string') {
        try {
          const msg = JSON.parse(data) as {
            kind?: string
            text?: string
            action?: string
          }
          if (msg.kind === 'chat' && typeof msg.text === 'string') {
            this.callbacks.onMessage(peerId, msg.text)
          } else if (msg.kind === 'file') {
            this.handleFileControl(peerId, channel, msg)
          }
        } catch {
          // ignore malformed frames
        }
      } else {
        void this.handleFileChunk(peerId, data)
      }
    }
  }

  private async negotiateOffer(peerId: string): Promise<void> {
    const conn = this.conns.get(peerId)
    if (!conn) return
    try {
      const offer = await conn.pc.createOffer()
      await conn.pc.setLocalDescription(offer)
      this.sendSignal(peerId, { type: 'offer', description: offer })
    } catch (error) {
      console.error('webrtc offer failed', peerId, error)
    }
  }

  async handleSignal(from: string, data: unknown): Promise<void> {
    if (!this.conns.has(from)) this.addPeer(from)
    const conn = this.conns.get(from)
    if (!conn) return
    const msg = data as RtcSignal
    try {
      if (msg.type === 'offer' || msg.type === 'answer') {
        await conn.pc.setRemoteDescription(msg.description)
        conn.remoteSet = true
        await this.flushCandidates(conn)
        if (msg.type === 'offer') {
          const answer = await conn.pc.createAnswer()
          await conn.pc.setLocalDescription(answer)
          this.sendSignal(from, { type: 'answer', description: answer })
        }
      } else if (msg.type === 'candidate') {
        if (conn.remoteSet) {
          await conn.pc.addIceCandidate(msg.candidate)
        } else {
          conn.queuedCandidates.push(msg.candidate)
        }
      }
    } catch (error) {
      console.error('webrtc signal failed', from, error)
    }
  }

  private async flushCandidates(conn: PeerConn): Promise<void> {
    const pending = conn.queuedCandidates.splice(0)
    for (const candidate of pending) {
      try {
        await conn.pc.addIceCandidate(candidate)
      } catch {
        // ignore invalid/duplicate candidates
      }
    }
  }

  // --- File transfer (peer-to-peer over the DataChannel) ---

  /** Propose a file to one peer. The peer must accept before chunks flow. */
  sendFile(peerId: string, name: string, mime: string, bytes: ArrayBuffer): boolean {
    const conn = this.conns.get(peerId)
    const channel = conn?.channel
    if (!conn || !channel || channel.readyState !== 'open' || conn.outgoing) {
      return false
    }
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    conn.outgoing = { id, bytes, seq: 0 }
    channel.send(
      JSON.stringify({
        kind: 'file',
        action: 'offer',
        id,
        name,
        size: bytes.byteLength,
        mime,
      }),
    )
    return true
  }

  acceptFile(peerId: string, id: string): void {
    const conn = this.conns.get(peerId)
    const channel = conn?.channel
    if (!conn || !channel) return
    if (conn.pendingOffer?.id === id) {
      conn.incoming = {
        id,
        name: conn.pendingOffer.name,
        size: conn.pendingOffer.size,
        parts: [],
        received: 0,
      }
      conn.pendingOffer = null
    }
    channel.send(JSON.stringify({ kind: 'file', action: 'accept', id }))
  }

  declineFile(peerId: string, id: string): void {
    const conn = this.conns.get(peerId)
    const channel = conn?.channel
    if (!conn || !channel) return
    if (conn.pendingOffer?.id === id) conn.pendingOffer = null
    channel.send(JSON.stringify({ kind: 'file', action: 'decline', id }))
  }

  cancelFile(peerId: string, id: string): void {
    const conn = this.conns.get(peerId)
    const channel = conn?.channel
    if (conn) {
      if (conn.outgoing?.id === id) conn.outgoing = null
      if (conn.incoming?.id === id) conn.incoming = null
      if (conn.pendingOffer?.id === id) conn.pendingOffer = null
    }
    if (channel) {
      channel.send(JSON.stringify({ kind: 'file', action: 'cancel', id }))
    }
  }

  private handleFileControl(
    peerId: string,
    channel: RTCDataChannel,
    msg: { action?: string; id?: string; name?: string; size?: number; mime?: string },
  ): void {
    const conn = this.conns.get(peerId)
    if (!conn) return
    switch (msg.action) {
      case 'offer':
        if (typeof msg.id === 'string' && !conn.pendingOffer && !conn.incoming) {
          conn.pendingOffer = {
            id: msg.id,
            name: msg.name ?? 'file',
            size: msg.size ?? 0,
            mime: msg.mime ?? '',
          }
          this.callbacks.onFileOffer(peerId, conn.pendingOffer)
        } else {
          channel.send(JSON.stringify({ kind: 'file', action: 'decline', id: msg.id }))
        }
        break
      case 'accept':
        if (conn.outgoing && conn.outgoing.id === msg.id) {
          this.pumpChunks(conn, channel)
        }
        break
      case 'decline':
        if (conn.outgoing?.id === msg.id) conn.outgoing = null
        this.callbacks.onFileCancelled(peerId)
        break
      case 'cancel':
        if (conn.outgoing?.id === msg.id) conn.outgoing = null
        if (conn.incoming?.id === msg.id) conn.incoming = null
        if (conn.pendingOffer?.id === msg.id) conn.pendingOffer = null
        this.callbacks.onFileCancelled(peerId)
        break
    }
  }

  private pumpChunks(conn: PeerConn, channel: RTCDataChannel): void {
    const out = conn.outgoing
    if (!out) return
    const CHUNK = 16384
    while (out.seq < out.bytes.byteLength) {
      const end = Math.min(out.bytes.byteLength, out.seq + CHUNK)
      channel.send(out.bytes.slice(out.seq, end))
      out.seq = end
    }
    conn.outgoing = null
  }

  private async handleFileChunk(
    peerId: string,
    data: ArrayBuffer | ArrayBufferView,
  ): Promise<void> {
    const conn = this.conns.get(peerId)
    const inc = conn?.incoming
    if (!conn || !inc) return
    const chunk: ArrayBuffer =
      data instanceof ArrayBuffer
        ? data
        : (() => {
            const view = data as ArrayBufferView
            const buf = new ArrayBuffer(view.byteLength)
            new Uint8Array(buf).set(
              new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
            )
            return buf
          })()
    inc.parts.push(chunk)
    inc.received += chunk.byteLength
    if (inc.received >= inc.size) {
      const name = inc.name
      conn.incoming = null
      const blob = new Blob(inc.parts)
      const bytes = await blob.arrayBuffer()
      this.callbacks.onFileComplete(peerId, name, bytes)
    }
  }

  broadcast(text: string): void {
    const payload = JSON.stringify({ kind: 'chat', text })
    for (const conn of this.conns.values()) {
      if (conn.channel && conn.channel.readyState === 'open') {
        conn.channel.send(payload)
      }
    }
  }

  close(): void {
    for (const conn of this.conns.values()) {
      conn.pc.close()
    }
    this.conns.clear()
  }
}