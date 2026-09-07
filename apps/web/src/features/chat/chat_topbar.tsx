import { User } from 'lucide-react'

interface ChatTopbarProps {
  displayName: string
  connected: boolean
}

function ChatTopbar({ displayName, connected }: ChatTopbarProps) {
  return (
    <header className="fixed left-72 right-0 top-0 z-40 flex h-12 items-center justify-between border-b border-surface-container-high bg-surface-container-lowest/90 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="font-mono text-code-inline uppercase text-on-surface-variant">
          CIPHER:
        </span>
        <span className="font-mono text-code-inline font-medium text-on-surface">
          AES-256-GCM · ECDH P-256
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-surface-container-high bg-surface-container-low px-3 py-1">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? 'bg-primary-container' : 'bg-outline'
            }`}
          />
          <span className="font-mono text-code-inline uppercase tracking-wider text-primary">
            {connected ? 'Connected' : 'Connecting'}
          </span>
        </div>
        <span className="max-w-[160px] truncate font-mono text-code-inline text-on-surface-variant">
          {displayName}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <User className="h-[18px] w-[18px] text-on-primary" />
        </div>
      </div>
    </header>
  )
}

export default ChatTopbar
