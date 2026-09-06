import { useState } from 'react'

import ChatTopbar from './chat_topbar'
import ChatWorkspace, { type ChatView } from './chat_workspace'
import IncinerateModal from './incinerate_modal'
import { type ChatMessage } from './message_feed'
import NavSidebar from './nav_sidebar'
import QrModal from './qr_modal'
import RoomSidebar from './room_sidebar'

let nextId = 100

function nowTime() {
  const now = new Date()
  return [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

function ChatPage() {
  const [view, setView] = useState<ChatView>('chat')
  const [sentMessages, setSentMessages] = useState<ChatMessage[]>([])
  const [qrOpen, setQrOpen] = useState(false)
  const [incinerateOpen, setIncinerateOpen] = useState(false)

  const handleSend = (text: string) => {
    setSentMessages((prev) => [
      ...prev,
      { id: nextId++, author: 'You', time: nowTime(), text, self: true },
    ])
    setView('chat')
  }

  const handleConfirmIncinerate = () => {
    setIncinerateOpen(false)
    setSentMessages([])
    setView('empty')
  }

  return (
    <>
      <NavSidebar />
      <div className="pl-72">
        <ChatTopbar />
        <main className="min-h-screen w-full bg-surface-container-lowest pt-12">
          <div className="flex h-[calc(100vh-48px)] w-full overflow-hidden bg-surface-container-lowest select-none">
            <RoomSidebar
              onInviteQr={() => setQrOpen(true)}
              onLeaveRoom={() => setIncinerateOpen(true)}
            />
            <ChatWorkspace
              view={view}
              onViewChange={setView}
              sentMessages={sentMessages}
              onSend={handleSend}
              onIncinerate={() => setIncinerateOpen(true)}
            />
          </div>
        </main>
      </div>
      <QrModal open={qrOpen} onClose={() => setQrOpen(false)} />
      <IncinerateModal
        open={incinerateOpen}
        onCancel={() => setIncinerateOpen(false)}
        onConfirm={handleConfirmIncinerate}
      />
    </>
  )
}

export default ChatPage
