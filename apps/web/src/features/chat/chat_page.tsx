import { useEffect, useRef, useState } from 'react'

import { RtcMesh } from '../../lib/rtc'
import {
  connectSignaling,
  type ServerMessage,
  type SignalingConnection,
} from '../../lib/signaling'
import ChatTopbar from './chat_topbar'
import ChatWorkspace, { type ChatView } from './chat_workspace'
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

  const connectionRef = useRef<SignalingConnection | null>(null)
  const meshRef = useRef<RtcMesh | null>(null)
  const idRef = useRef(1)

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

  const handleConfirmIncinerate = () => {
    setIncinerateOpen(false)
    meshRef.current?.close()
    connectionRef.current?.close()
    connectionRef.current = null
    setMessages([])
    setPeers([])
    setConnections({})
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
              onIncinerate={() => setIncinerateOpen(true)}
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
    </>
  )
}

export default ChatPage