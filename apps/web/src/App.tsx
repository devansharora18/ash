import { useState } from 'react'

import SiteFooter from './components/site_footer'
import SiteHeader from './components/site_header'
import SettingsModal from './components/settings_modal'
import ChatPage from './features/chat/chat_page'
import HomePage from './features/home/home_page'
import { loadSettings, saveSettings, type Settings } from './lib/settings'

function App() {
  const [page, setPage] = useState<'home' | 'chat'>('home')
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleSaveSettings = (displayName: string, backendUrl: string) => {
    const next: Settings = { displayName, backendUrl }
    setSettings(next)
    saveSettings(next)
  }

  if (page === 'chat') {
    return <ChatPage />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="w-full flex-1 pt-12">
        <HomePage
          onEnterChat={() => setPage('chat')}
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
