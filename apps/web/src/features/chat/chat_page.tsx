import { useEffect, useRef, useState } from 'react'

import {
  connectSignaling,
  type ChatPayload,
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
  onLeave: () => void
}

function ChatPage({ displayName, backendUrl, roomId, onLeave }: ChatPageProps) {
  const [view, setView] = useState<ChatView>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [peers, setPeers] = useState<string[]>([])
  const [status, setStatus] = useState<ConnectionStatus>({ kind: 'connecting' })
  const [qrOpen, setQrOpen] = useState(false)
  const [incinerateOpen, setIncinerateOpen] = useState(false)

  const connectionRef = useRef<SignalingConnection | null>(null)
  const idRef = useRef(1)

  useEffect(() => {
    const connection = connectSignaling({
      backendUrl,
      roomId,
      peerId: displayName,
      onMessage: (message: ServerMessage) => {
        switch (message.type) {
          case 'welcome':
            setPeers(message.peers)
            setStatus({ kind: 'connected' })
            break
          case 'peer-joined':
            setPeers((prev) =>
              prev.includes(message.peer_id)
                ? prev
                : [...prev, message.peer_id],
            )
            break
          case 'peer-left':
            setPeers((prev) => prev.filter((id) => id !== message.peer_id))
            break
          case 'signal': {
            const data = message.data as Partial<ChatPayload> | null
            if (data && data.kind === 'chat' && typeof data.text === 'string') {
              setMessages((prev) => [
                ...prev,
                {
                  id: idRef.current++,
                  author: message.from,
                  time: nowTime(),
                  text: data.text as string,
                  self: false,
                },
              ])
            }
            break
          }
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
    }
  }, [backendUrl, roomId, displayName])

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
    const payload: ChatPayload = { kind: 'chat', text }
    for (const peer of peers) {
      connectionRef.current?.send(peer, payload)
    }
    setView('chat')
  }

  const handleConfirmIncinerate = () => {
    setIncinerateOpen(false)
    connectionRef.current?.close()
    connectionRef.current = null
    setMessages([])
    setPeers([])
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
              onInviteQr={() => setQrOpen(true)}
              onLeaveRoom={() => setIncinerateOpen(true)}
            />
            <ChatWorkspace
              view={view}
              onViewChange={setView}
              roomId={roomId}
              messages={messages}
              peersOnline={peers.length}
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
