import {
  b64ToBuf,
  bufToB64,
  decryptBlock,
  deriveSessionKey,
  encryptBlock,
  newNonce,
  type Identity,
} from './crypto'
import type { Settings } from './settings'

const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
]

export type SignalSender = (to: string, data: unknown) => void

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

/**
 * Resolve the ICE servers to feed RTCPeerConnection. When a Metered-style
 * credentials endpoint is configured, fetch rotating TURN credentials from it
 * (its response is already a ready-to-use `iceServers` array); otherwise fall
 * back to the static STUN + TURN list.
 */
export async function resolveIceServers(
  settings: Settings,
): Promise<RTCIceServer[]> {
  if (settings.turnCredentialsUrl) {
    try {
      const res = await fetch(settings.turnCredentialsUrl)
      if (res.ok) {
        const json: unknown = await res.json()
        if (Array.isArray(json) && json.length > 0) {
          return json as RTCIceServer[]
        }
      }
    } catch {
      // fall through to static servers
    }
  }
  return buildIceServers(settings)
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
  lastProgressEmit: number
  shareSenders: RTCRtpSender[]
}

export interface FileOffer {
  id: string
  name: string
  size: number
  mime: string
}

export interface FileProgress {
  id: string
  name: string
  size: number
  sent: number
  direction: 'send' | 'receive'
}

export interface BoardStroke {
  id: string
  color: string
  width: number
  points: { x: number; y: number }[]
}

/** A normalized (0..1) whiteboard drawing event streamed between peers. */
export type BoardEvent =
  | { type: 'start'; id: string; color: string; width: number; x: number; y: number }
  | { type: 'point'; id: string; x: number; y: number }
  | { type: 'end'; id: string }
  | { type: 'clear' }
  | { type: 'sync'; strokes: BoardStroke[] }

interface OutgoingFile {
  id: string
  name: string
  file: Blob
  seq: number
  kind: 'file' | 'voice'
  durationMs: number
}

interface IncomingFile {
  id: string
  name: string
  size: number
  parts: BlobPart[]
  received: number
  kind: 'file' | 'voice'
  durationMs: number
}

export interface MeshCallbacks {
  onMessage: (from: string, text: string) => void
  onConnectionChange: (peerId: string, connected: boolean) => void
  onFileOffer: (from: string, offer: FileOffer) => void
  onFileProgress: (from: string, progress: FileProgress) => void
  onFileComplete: (from: string, name: string, blob: Blob) => void
  onFileCancelled: (from: string) => void
  onVoiceMessage: (from: string, blob: Blob, durationMs: number) => void
  onBoard: (from: string, event: BoardEvent) => void
  onRemoteStream: (from: string, stream: MediaStream) => void
  onRemoteStreamEnd: (from: string) => void
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
  private peerPub = new Map<string, string>()
  private sessionKey = new Map<string, CryptoKey>()
  private selfId: string
  private sendSignal: SignalSender
  private callbacks: MeshCallbacks
  private iceServers: RTCIceServer[]
  private shareStream: MediaStream | null = null
  private identity: Identity

  constructor(
    selfId: string,
    sendSignal: SignalSender,
    callbacks: MeshCallbacks,
    identity: Identity,
    iceServers: RTCIceServer[] = STUN_SERVERS,
  ) {
    this.selfId = selfId
    this.sendSignal = sendSignal
    this.callbacks = callbacks
    this.identity = identity
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
      lastProgressEmit: 0,
      shareSenders: [],
    }
    this.conns.set(peerId, conn)
    this.bindIce(peerId, pc)
    pc.ondatachannel = (event) => this.attachChannel(peerId, event.channel)
    pc.ontrack = (event) => {
      const stream = event.streams[0]
      if (stream) this.callbacks.onRemoteStream(peerId, stream)
      event.track.addEventListener('ended', () =>
        this.callbacks.onRemoteStreamEnd(peerId),
      )
    }

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
    channel.onopen = () => {
      this.callbacks.onConnectionChange(peerId, true)
      channel.send(
        JSON.stringify({ kind: 'e2ee', action: 'key', pub: this.identity.pubB64 }),
      )
    }
    channel.onclose = () => this.callbacks.onConnectionChange(peerId, false)
    channel.onmessage = (event) => {
      const data = event.data
      if (typeof data === 'string') {
        try {
          const msg = JSON.parse(data) as {
            kind?: string
            action?: string
            pub?: string
            nonce?: string
            ct?: string
          }
          if (msg.kind === 'e2ee' && msg.action === 'key' && typeof msg.pub === 'string') {
            this.peerPub.set(peerId, msg.pub)
            void this.ensureSessionKey(peerId).catch(() => {})
          } else if (
            msg.kind === 'esc' &&
            typeof msg.nonce === 'string' &&
            typeof msg.ct === 'string'
          ) {
            void this.handleDecrypted(peerId, channel, msg.nonce, msg.ct)
          }
        } catch {
          // ignore malformed frames
        }
      } else {
        void this.handleFileChunk(peerId, data)
      }
    }
  }

  private async ensureSessionKey(peerId: string): Promise<CryptoKey | null> {
    const cached = this.sessionKey.get(peerId)
    if (cached) return cached
    const peerPubRaw = this.peerPub.get(peerId)
    if (!peerPubRaw) return null
    try {
      const key = await deriveSessionKey(this.identity, peerPubRaw)
      this.sessionKey.set(peerId, key)
      return key
    } catch {
      return null
    }
  }

  /** AES-GCM-encrypt an inner message with the peer's session key and send it. */
  private async encryptJsonTo(
    peerId: string,
    channel: RTCDataChannel,
    inner: unknown,
  ): Promise<boolean> {
    const key = await this.ensureSessionKey(peerId)
    if (!key) return false
    try {
      const data = new Uint8Array(new TextEncoder().encode(JSON.stringify(inner)))
      const nonce = newNonce()
      const ct = await encryptBlock(key, nonce, data)
      channel.send(
        JSON.stringify({ kind: 'esc', nonce: bufToB64(nonce), ct: bufToB64(ct) }),
      )
      return true
    } catch {
      return false
    }
  }

  private async handleDecrypted(
    peerId: string,
    channel: RTCDataChannel,
    nonceB64: string,
    ctB64: string,
  ): Promise<void> {
    const key = await this.ensureSessionKey(peerId)
    if (!key) return
    try {
      const plain = await decryptBlock(key, b64ToBuf(nonceB64), b64ToBuf(ctB64))
      const inner = JSON.parse(new TextDecoder().decode(plain)) as {
        kind?: string
        text?: string
        action?: string
      }
      if (inner.kind === 'chat' && typeof inner.text === 'string') {
        this.callbacks.onMessage(peerId, inner.text)
      } else if (inner.kind === 'file' || inner.kind === 'voice') {
        this.handleTransferControl(peerId, channel, inner)
      } else if (inner.kind === 'board') {
        this.callbacks.onBoard(peerId, inner as unknown as BoardEvent)
      }
    } catch {
      // ignore undecryptable payloads
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
  async sendFile(peerId: string, file: File): Promise<boolean> {
    const conn = this.conns.get(peerId)
    const channel = conn?.channel
    if (!conn || !channel || channel.readyState !== 'open' || conn.outgoing) {
      return false
    }
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    conn.outgoing = { id, name: file.name, file, seq: 0, kind: 'file', durationMs: 0 }
    return this.encryptJsonTo(peerId, channel, {
      kind: 'file',
      action: 'offer',
      id,
      name: file.name,
      size: file.size,
      mime: file.type,
    })
  }

  /** Send a voice message blob to one peer. Accepted automatically, held in RAM only. */
  async sendVoice(peerId: string, blob: Blob, durationMs: number): Promise<boolean> {
    const conn = this.conns.get(peerId)
    const channel = conn?.channel
    if (!conn || !channel || channel.readyState !== 'open' || conn.outgoing) {
      return false
    }
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    conn.outgoing = {
      id,
      name: 'Voice message',
      file: blob,
      seq: 0,
      kind: 'voice',
      durationMs,
    }
    return this.encryptJsonTo(peerId, channel, {
      kind: 'voice',
      action: 'offer',
      id,
      size: blob.size,
      mime: blob.type,
      durationMs,
    })
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
        kind: 'file',
        durationMs: 0,
      }
      conn.pendingOffer = null
    }
    void this.encryptJsonTo(peerId, channel, { kind: 'file', action: 'accept', id })
  }

  declineFile(peerId: string, id: string): void {
    const conn = this.conns.get(peerId)
    const channel = conn?.channel
    if (!conn || !channel) return
    if (conn.pendingOffer?.id === id) conn.pendingOffer = null
    void this.encryptJsonTo(peerId, channel, { kind: 'file', action: 'decline', id })
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
      void this.encryptJsonTo(peerId, channel, { kind: 'file', action: 'cancel', id })
    }
  }

  private handleTransferControl(
    peerId: string,
    channel: RTCDataChannel,
    msg: {
      kind?: string
      action?: string
      id?: string
      name?: string
      size?: number
      mime?: string
      durationMs?: number
    },
  ): void {
    const conn = this.conns.get(peerId)
    if (!conn) return
    switch (msg.action) {
      case 'offer':
        if (msg.kind === 'voice' && typeof msg.id === 'string') {
          conn.incoming = {
            id: msg.id,
            name: 'Voice message',
            size: msg.size ?? 0,
            parts: [],
            received: 0,
            kind: 'voice',
            durationMs: msg.durationMs ?? 0,
          }
          void this.encryptJsonTo(peerId, channel, {
            kind: 'voice',
            action: 'accept',
            id: msg.id,
          })
        } else if (
          typeof msg.id === 'string' &&
          !conn.pendingOffer &&
          !conn.incoming
        ) {
          conn.pendingOffer = {
            id: msg.id,
            name: msg.name ?? 'file',
            size: msg.size ?? 0,
            mime: msg.mime ?? '',
          }
          this.callbacks.onFileOffer(peerId, conn.pendingOffer)
        } else {
          void this.encryptJsonTo(peerId, channel, {
            kind: 'file',
            action: 'decline',
            id: msg.id,
          })
        }
        break
      case 'accept':
        if (conn.outgoing && conn.outgoing.id === msg.id) {
          void this.pumpChunks(peerId, conn, channel)
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

  private async pumpChunks(
    peerId: string,
    conn: PeerConn,
    channel: RTCDataChannel,
  ): Promise<void> {
    const out = conn.outgoing
    if (!out) return
    const CHUNK = 16384
    const backpressure = 1 << 21 // ~2MB queued before we wait
    const key = await this.ensureSessionKey(peerId)
    if (!key) return
    while (out.seq < out.file.size) {
      if (conn.outgoing !== out) break // cancelled
      while (channel.bufferedAmount > backpressure) {
        await sleep(25)
        if (channel.readyState !== 'open') break
      }
      if (channel.readyState !== 'open') break
      const end = Math.min(out.file.size, out.seq + CHUNK)
      const raw = new Uint8Array(await out.file.slice(out.seq, end).arrayBuffer())
      try {
        const nonce = newNonce()
        const ct = await encryptBlock(key, nonce, raw)
        const framed = new Uint8Array(12 + ct.length)
        framed.set(nonce, 0)
        framed.set(ct, 12)
        channel.send(framed)
      } catch {
        break // auth/encryption failure
      }
      out.seq = end
      if (out.kind === 'file') {
        this.emitProgress(
          peerId,
          conn,
          out.id,
          out.name,
          out.file.size,
          out.seq,
          'send',
        )
      }
    }
    conn.outgoing = null
    if (out.kind === 'file') {
      this.emitProgress(
        peerId,
        conn,
        out.id,
        out.name,
        out.file.size,
        out.file.size,
        'send',
        true,
      )
    }
  }

  private emitProgress(
    peerId: string,
    conn: PeerConn,
    id: string,
    name: string,
    size: number,
    sent: number,
    direction: 'send' | 'receive',
    force = false,
  ): void {
    const now = Date.now()
    if (force || sent >= size || now - conn.lastProgressEmit > 250) {
      conn.lastProgressEmit = now
      this.callbacks.onFileProgress(peerId, { id, name, size, sent, direction })
    }
  }

  private async handleFileChunk(
    peerId: string,
    data: ArrayBuffer | ArrayBufferView,
  ): Promise<void> {
    const conn = this.conns.get(peerId)
    const inc = conn?.incoming
    if (!conn || !inc) return
    const key = await this.ensureSessionKey(peerId)
    if (!key) return
    const raw: Uint8Array<ArrayBuffer> =
      data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : (() => {
            const view = data as ArrayBufferView
            const copy = new Uint8Array(view.byteLength)
            copy.set(
              new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
            )
            return copy
          })()
    try {
      const plain = await decryptBlock(key, raw.slice(0, 12), raw.slice(12))
      inc.parts.push(plain)
      inc.received += plain.byteLength
    } catch {
      conn.incoming = null // auth failure -> abort this transfer
      return
    }
    if (inc.kind === 'file') {
      this.emitProgress(
        peerId,
        conn,
        inc.id,
        inc.name,
        inc.size,
        inc.received,
        'receive',
      )
    }
    if (inc.received >= inc.size) {
      const name = inc.name
      const size = inc.size
      const id = inc.id
      const parts = inc.parts
      const kind = inc.kind
      const durationMs = inc.durationMs
      conn.incoming = null
      const blob = new Blob(parts)
      if (kind === 'voice') {
        this.callbacks.onVoiceMessage(peerId, blob, durationMs)
      } else {
        this.callbacks.onFileProgress(peerId, { id, name, size, sent: size, direction: 'receive' })
        this.callbacks.onFileComplete(peerId, name, blob)
      }
    }
  }

  /** Encrypt and send a chat message to every connected peer whose key we know. */
  async broadcast(text: string): Promise<void> {
    for (const [peerId, conn] of this.conns) {
      if (!conn.channel || conn.channel.readyState !== 'open') continue
      await this.encryptJsonTo(peerId, conn.channel, { kind: 'chat', text })
    }
  }

  /** Stream a whiteboard drawing event to every connected peer. */
  async broadcastBoard(event: BoardEvent): Promise<void> {
    for (const [peerId, conn] of this.conns) {
      if (!conn.channel || conn.channel.readyState !== 'open') continue
      await this.encryptJsonTo(peerId, conn.channel, { kind: 'board', ...event })
    }
  }

  /** Send the full board state to one peer (late-join sync over its channel). */
  async sendBoardSync(peerId: string, strokes: BoardStroke[]): Promise<boolean> {
    const conn = this.conns.get(peerId)
    const channel = conn?.channel
    if (!conn || !channel || channel.readyState !== 'open') return false
    return this.encryptJsonTo(peerId, channel, {
      kind: 'board',
      type: 'sync',
      strokes,
    })
  }

  /** Start broadcasting a screen/display stream to every connected peer. */
  startScreenShare(stream: MediaStream): void {
    this.shareStream = stream
    for (const peerId of this.conns.keys()) {
      this.attachScreenShare(peerId)
    }
  }

  /** Add the active share stream to one peer and renegotiate (late join). */
  attachScreenShare(peerId: string): void {
    const conn = this.conns.get(peerId)
    const stream = this.shareStream
    if (!conn || conn.shareSenders.length > 0 || !stream) return
    for (const track of stream.getTracks()) {
      const sender = conn.pc.addTrack(track, stream)
      if (sender) conn.shareSenders.push(sender)
    }
    void this.negotiateOffer(peerId)
  }

  /** Stop sharing and renegotiate the tracks away from every peer. */
  stopScreenShare(): void {
    const stream = this.shareStream
    this.shareStream = null
    for (const [peerId, conn] of this.conns) {
      const had = conn.shareSenders.length > 0
      for (const sender of conn.shareSenders) {
        try {
          conn.pc.removeTrack(sender)
        } catch {
          // ignore
        }
      }
      conn.shareSenders = []
      if (had) void this.negotiateOffer(peerId)
    }
    stream?.getTracks().forEach((track) => track.stop())
  }

  close(): void {
    for (const conn of this.conns.values()) {
      conn.pc.close()
    }
    this.conns.clear()
    this.shareStream?.getTracks().forEach((track) => track.stop())
    this.shareStream = null
  }
}