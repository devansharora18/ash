const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

type SignalSender = (to: string, data: unknown) => void

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
}

export interface MeshCallbacks {
  onMessage: (from: string, text: string) => void
  onConnectionChange: (peerId: string, connected: boolean) => void
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

  constructor(selfId: string, sendSignal: SignalSender, callbacks: MeshCallbacks) {
    this.selfId = selfId
    this.sendSignal = sendSignal
    this.callbacks = callbacks
  }

  addPeer(peerId: string): void {
    if (this.conns.has(peerId)) return
    const pc = new RTCPeerConnection(RTC_CONFIG)
    const conn: PeerConn = {
      pc,
      channel: null,
      connected: false,
      remoteSet: false,
      queuedCandidates: [],
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
      try {
        const data = JSON.parse(event.data as string) as {
          kind?: string
          text?: string
        }
        if (data.kind === 'chat' && typeof data.text === 'string') {
          this.callbacks.onMessage(peerId, data.text)
        }
      } catch {
        // ignore malformed frames
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