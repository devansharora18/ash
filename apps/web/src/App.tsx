import { useState } from 'react'

import SiteFooter from './components/site_footer'
import SiteHeader from './components/site_header'
import ChatPage from './features/chat/chat_page'
import HomePage from './features/home/home_page'

function App() {
  const [page, setPage] = useState<'home' | 'chat'>('home')

  if (page === 'chat') {
    return <ChatPage />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="w-full flex-1 pt-12">
        <HomePage onEnterChat={() => setPage('chat')} />
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
