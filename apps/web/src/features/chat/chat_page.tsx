import { useEffect, useRef, useState } from 'react'
import { Send, X } from 'lucide-react'

import {
  RtcMesh,
  type BoardStroke,
  type FileOffer,
  type FileProgress,
} from '../../lib/rtc'
import {
  connectSignaling,
  type ServerMessage,
  type SignalingConnection,
} from '../../lib/signaling'
import ChatTopbar from './chat_topbar'
import ChatWorkspace, { type ChatView } from './chat_workspace'
import FileReceiveModal from './file_receive_modal'
import IncinerateModal from './incinerate_modal'
import { type ChatMessage } from './message_feed'
import NavSidebar from './nav_sidebar'
import QrModal from './qr_modal'
import RoomSidebar from './room_sidebar'

type ConnectionStatus =
  | { kind: 'connecting' }
  | { kind: 'connected' }
  | { kind: 'error'; message: string }

const CLOSE_REASONS: Record<number, string> = {
  4404: 'Room not found. It may have expired or the code is wrong.',
  4400: 'Invalid display name.',
  4409: 'Display name already in use in this room.',
  4408: 'Room expired.',
}

function nowTime() {
  const now = new Date()
  return [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 10000)
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

interface IncomingPending {
  from: string
  offer: FileOffer
}

interface TransferItem {
  peerId: string
  id: string
  name: string
  size: number
  sent: number
  direction: 'send' | 'receive'
}

interface ChatPageProps {
  displayName: string
  backendUrl: string
  roomId: string
  iceServers: RTCIceServer[]
  onLeave: () => void
}

function ChatPage({
  displayName,
  backendUrl,
  roomId,
  iceServers,
  onLeave,
}: ChatPageProps) {
  const [view, setView] = useState<ChatView>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [peers, setPeers] = useState<string[]>([])
  const [connections, setConnections] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<ConnectionStatus>({ kind: 'connecting' })
  const [qrOpen, setQrOpen] = useState(false)
  const [incinerateOpen, setIncinerateOpen] = useState(false)
  const [incomingFile, setIncomingFile] = useState<IncomingPending | null>(null)
  const [sendFile, setSendFile] = useState<File | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [transfers, setTransfers] = useState<TransferItem[]>([])
  const [strokes, setStrokes] = useState<BoardStroke[]>([])

  const connectionRef = useRef<SignalingConnection | null>(null)
  const meshRef = useRef<RtcMesh | null>(null)
  const idRef = useRef(1)
  const voiceUrlsRef = useRef<string[]>([])
  const activeStrokeRef = useRef<string | null>(null)
  const strokesRef = useRef<BoardStroke[]>([])

  useEffect(() => {
    strokesRef.current = strokes
  }, [strokes])

  const applyProgress = (from: string, progress: FileProgress) => {
    setTransfers((prev) => {
      const idx = prev.findIndex(
        (t) => t.peerId === from && t.id === progress.id,
      )
      if (idx === -1) {
        return [
          ...prev,
          {
            peerId: from,
            id: progress.id,
            name: progress.name,
            size: progress.size,
            sent: progress.sent,
            direction: progress.direction,
          },
        ]
      }
      const next = [...prev]
      next[idx] = { ...next[idx], sent: progress.sent }
      return next
    })
  }

  useEffect(() => {
    const mesh = new RtcMesh(
      displayName,
      (to, data) => connectionRef.current?.send(to, data),
      {
        onMessage: (from, text) => {
          setMessages((prev) => [
            ...prev,
            {
              id: idRef.current++,
              author: from,
              time: nowTime(),
              text,
              self: false,
            },
          ])
        },
        onConnectionChange: (peerId, connected) => {
          setConnections((prev) => ({ ...prev, [peerId]: connected }))
          if (connected && strokesRef.current.length > 0) {
            meshRef.current?.sendBoardSync(peerId, strokesRef.current)
          }
        },
        onFileOffer: (from, offer) => {
          setIncomingFile({ from, offer })
        },
        onFileProgress: (from, progress) => {
          applyProgress(from, progress)
        },
        onFileComplete: (from, name, blob) => {
          downloadBlob(name, blob)
          setTransfers((prev) => prev.filter((t) => t.peerId !== from))
          setToast(`Received ${name} from ${from}`)
        },
        onFileCancelled: (from) => {
          setIncomingFile((prev) => (prev?.from === from ? null : prev))
          setTransfers((prev) => prev.filter((t) => t.peerId !== from))
          setToast(`File transfer with ${from} cancelled`)
        },
        onVoiceMessage: (from, blob, durationMs) => {
          const url = URL.createObjectURL(blob)
          voiceUrlsRef.current.push(url)
          setMessages((prev) => [
            ...prev,
            {
              id: idRef.current++,
              author: from,
              time: nowTime(),
              self: false,
              voice: { url, durationMs },
            },
          ])
          setView('chat')
        },
        onBoard: (from, event) => {
          void from
          switch (event.type) {
            case 'start':
              setStrokes((prev) =>
                prev.some((s) => s.id === event.id)
                  ? prev
                  : [
                      ...prev,
                      {
                        id: event.id,
                        color: event.color,
                        width: event.width,
                        points: [{ x: event.x, y: event.y }],
                      },
                    ],
              )
              break
            case 'point':
              setStrokes((prev) =>
                prev.map((s) =>
                  s.id === event.id
                    ? { ...s, points: [...s.points, { x: event.x, y: event.y }] }
                    : s,
                ),
              )
              break
            case 'end':
              break
            case 'clear':
              setStrokes([])
              break
            case 'sync':
              setStrokes((prev) => {
                const seen = new Set(prev.map((s) => s.id))
                const fresh = event.strokes.filter((s) => !seen.has(s.id))
                return fresh.length ? [...prev, ...fresh] : prev
              })
              break
          }
        },
      },
      iceServers,
    )
    meshRef.current = mesh

    const connection = connectSignaling({
      backendUrl,
      roomId,
      peerId: displayName,
      onMessage: (message: ServerMessage) => {
        switch (message.type) {
          case 'welcome':
            setPeers(message.peers)
            setStatus({ kind: 'connected' })
            for (const peer of message.peers) mesh.addPeer(peer)
            break
          case 'peer-joined':
            setPeers((prev) =>
              prev.includes(message.peer_id)
                ? prev
                : [...prev, message.peer_id],
            )
            mesh.addPeer(message.peer_id)
            break
          case 'peer-left':
            setPeers((prev) => prev.filter((id) => id !== message.peer_id))
            mesh.removePeer(message.peer_id)
            setConnections((prev) => {
              const next = { ...prev }
              delete next[message.peer_id]
              return next
            })
            break
          case 'signal':
            void mesh.handleSignal(message.from, message.data)
            break
          case 'error':
            break
        }
      },
      onClose: (code, reason) => {
        setStatus((prev) => {
          if (prev.kind === 'connected') {
            return { kind: 'error', message: 'Disconnected from the room.' }
          }
          return {
            kind: 'error',
            message:
              CLOSE_REASONS[code] ??
              (reason || 'Could not connect to the backend.'),
          }
        })
      },
    })
    connectionRef.current = connection

    return () => {
      connection.close()
      connectionRef.current = null
      mesh.close()
      meshRef.current = null
    }
  }, [backendUrl, roomId, displayName, iceServers])

  const connectedCount = Object.values(connections).filter(Boolean).length

  const handleSend = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: idRef.current++,
        author: displayName,
        time: nowTime(),
        text,
        self: true,
      },
    ])
    meshRef.current?.broadcast(text)
    setView('chat')
  }

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(t)
  }, [toast])

  const handleFilePick = (file: File) => {
    setSendFile(file)
  }

  const handleVoiceRecord = (blob: Blob, durationMs: number) => {
    const url = URL.createObjectURL(blob)
    voiceUrlsRef.current.push(url)
    setMessages((prev) => [
      ...prev,
      {
        id: idRef.current++,
        author: displayName,
        time: nowTime(),
        self: true,
        voice: { url, durationMs },
      },
    ])
    const targets = Object.entries(connections)
      .filter(([, connected]) => connected)
      .map(([peerId]) => peerId)
    for (const peerId of targets) {
      meshRef.current?.sendVoice(peerId, blob, durationMs)
    }
    setView('chat')
  }

  const cancelTransfer = (t: TransferItem) => {
    meshRef.current?.cancelFile(t.peerId, t.id)
    setTransfers((prev) =>
      prev.filter((x) => !(x.peerId === t.peerId && x.id === t.id)),
    )
  }

  const sendFileTo = async (peerId: string) => {
    if (!sendFile) return
    meshRef.current?.sendFile(peerId, sendFile)
    setSendFile(null)
  }

  const acceptIncoming = () => {
    if (!incomingFile) return
    meshRef.current?.acceptFile(incomingFile.from, incomingFile.offer.id)
    setIncomingFile(null)
  }

  const declineIncoming = () => {
    if (!incomingFile) return
    meshRef.current?.declineFile(incomingFile.from, incomingFile.offer.id)
    setIncomingFile(null)
  }

  const boardNewId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

  const handleStrokeStart = (x: number, y: number, color: string, width: number) => {
    const id = boardNewId()
    activeStrokeRef.current = id
    setStrokes((prev) => [...prev, { id, color, width, points: [{ x, y }] }])
    meshRef.current?.broadcastBoard({ type: 'start', id, color, width, x, y })
  }

  const handleStrokePoint = (x: number, y: number) => {
    const id = activeStrokeRef.current
    if (!id) return
    setStrokes((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, points: [...s.points, { x, y }] } : s,
      ),
    )
    meshRef.current?.broadcastBoard({ type: 'point', id, x, y })
  }

  const handleStrokeEnd = () => {
    const id = activeStrokeRef.current
    if (!id) return
    activeStrokeRef.current = null
    meshRef.current?.broadcastBoard({ type: 'end', id })
  }

  const handleBoardClear = () => {
    setStrokes([])
    meshRef.current?.broadcastBoard({ type: 'clear' })
  }

  const handleConfirmIncinerate = () => {
    setIncinerateOpen(false)
    meshRef.current?.close()
    connectionRef.current?.close()
    connectionRef.current = null
    setMessages([])
    setPeers([])
    setConnections({})
    for (const url of voiceUrlsRef.current) URL.revokeObjectURL(url)
    voiceUrlsRef.current = []
    onLeave()
  }

  return (
    <>
      <NavSidebar />
      <div className="pl-72">
        <ChatTopbar
          displayName={displayName}
          connected={status.kind === 'connected'}
        />
        <main className="min-h-screen w-full bg-surface-container-lowest pt-12">
          <div className="flex h-[calc(100vh-48px)] w-full overflow-hidden bg-surface-container-lowest select-none">
            <RoomSidebar
              roomId={roomId}
              displayName={displayName}
              peers={peers}
              connections={connections}
              onInviteQr={() => setQrOpen(true)}
              onLeaveRoom={() => setIncinerateOpen(true)}
            />
            <ChatWorkspace
              view={view}
              onViewChange={setView}
              roomId={roomId}
              messages={messages}
              peersOnline={connectedCount}
              statusMessage={
                status.kind === 'connecting'
                  ? 'Connecting…'
                  : status.kind === 'error'
                    ? status.message
                    : null
              }
              onSend={handleSend}
              onFilePick={handleFilePick}
              onVoiceRecord={handleVoiceRecord}
              onIncinerate={() => setIncinerateOpen(true)}
              strokes={strokes}
              onStrokeStart={handleStrokeStart}
              onStrokePoint={handleStrokePoint}
              onStrokeEnd={handleStrokeEnd}
              onBoardClear={handleBoardClear}
            />
          </div>
        </main>
      </div>
      <QrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        roomId={roomId}
      />
      <IncinerateModal
        open={incinerateOpen}
        onCancel={() => setIncinerateOpen(false)}
        onConfirm={handleConfirmIncinerate}
      />
      {incomingFile && (
        <FileReceiveModal
          from={incomingFile.from}
          offer={incomingFile.offer}
          onAccept={acceptIncoming}
          onDecline={declineIncoming}
        />
      )}
      {sendFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-[420px] space-y-3 rounded-xl bg-surface-container-lowest p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-headline-md font-medium text-on-surface">
                Send file
              </h3>
              <button
                type="button"
                onClick={() => setSendFile(null)}
                className="p-1 text-outline transition-colors hover:text-on-surface"
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="truncate font-sans text-body-sm text-on-surface">
              {sendFile.name}
              <span className="text-on-surface-variant">
                {' '}· {formatSize(sendFile.size)}
              </span>
            </p>
            <p className="font-sans text-caption text-on-surface-variant">
              Choose a connected peer to receive it:
            </p>
            <div className="space-y-1.5">
              {peers.filter((id) => connections[id]).length === 0 && (
                <p className="rounded-lg bg-surface-container-low px-3 py-2 font-sans text-caption text-outline">
                  No peers connected yet.
                </p>
              )}
              {peers
                .filter((id) => connections[id])
                .map((peerId) => (
                  <button
                    key={peerId}
                    type="button"
                    onClick={() => void sendFileTo(peerId)}
                    className="flex w-full items-center justify-between rounded-lg bg-surface-container-low px-3 py-2 font-sans text-body-sm text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary-container"
                  >
                    <span>{peerId}</span>
                    <Send className="h-4 w-4 text-on-surface-variant" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
      {transfers.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
          {transfers.map((t) => {
            const pct = t.size > 0 ? Math.min(100, Math.round((t.sent / t.size) * 100)) : 0
            return (
              <div
                key={`${t.peerId}-${t.id}`}
                className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-3 shadow-xl"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-sans text-body-sm-medium text-on-surface">
                    {t.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => cancelTransfer(t)}
                    title="Cancel"
                    className="rounded p-1 text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-primary-container transition-[width] duration-200"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between font-mono text-code-inline text-on-surface-variant">
                  <span>
                    {t.direction === 'send' ? 'Sending' : 'Receiving'} · {pct}%
                  </span>
                  <span>
                    {formatSize(Math.min(t.sent, t.size))} / {formatSize(t.size)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-surface-container-high px-4 py-2 font-sans text-body-sm text-on-surface shadow-xl">
          {toast}
        </div>
      )}
    </>
  )
}

export default ChatPage