import { useState } from 'react'

import SiteFooter from './components/site_footer'
import SiteHeader from './components/site_header'
import SettingsModal from './components/settings_modal'
import ChatPage from './features/chat/chat_page'
import HomePage from './features/home/home_page'
import { loadSettings, saveSettings, type Settings } from './lib/settings'

function initialRoom(): string | null {
  return new URLSearchParams(window.location.search).get('room')
}

function App() {
  const [page, setPage] = useState<'home' | 'chat'>(
    initialRoom() ? 'chat' : 'home',
  )
  const [roomId, setRoomId] = useState<string | null>(initialRoom())
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const enterChat = (id: string) => {
    setRoomId(id)
    setPage('chat')
  }

  const handleSaveSettings = (displayName: string, backendUrl: string) => {
    const next: Settings = { displayName, backendUrl }
    setSettings(next)
    saveSettings(next)
  }

  const handleLeave = () => {
    setRoomId(null)
    setPage('home')
    window.history.replaceState(null, '', window.location.pathname)
  }

  if (page === 'chat' && roomId) {
    return (
      <ChatPage
        displayName={settings.displayName}
        backendUrl={settings.backendUrl}
        roomId={roomId}
        onLeave={handleLeave}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="w-full flex-1 pt-12">
        <HomePage
          backendUrl={settings.backendUrl}
          onCreateRoom={enterChat}
          onJoinRoom={enterChat}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </main>
      <SiteFooter />
      {settingsOpen && (
        <SettingsModal
          displayName={settings.displayName}
          backendUrl={settings.backendUrl}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}

export default App
