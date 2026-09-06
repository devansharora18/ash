import { EyeOff, KeyRound, Settings, Shield, Terminal } from 'lucide-react'

import RoomActionCard from './room_action_card'

const explainerItems = [
  {
    icon: KeyRound,
    text: 'End-to-end encrypted directly between client browsers via ECDH key exchange.',
  },
  {
    icon: EyeOff,
    text: 'Zero persistence. Messages exist strictly in volatile RAM and never touch disk.',
  },
  {
    icon: Terminal,
    text: 'Automatic garbage collection when the last peer departs the channel.',
  },
]

interface HomePageProps {
  onEnterChat: () => void
  onOpenSettings: () => void
}

function HomePage({ onEnterChat, onOpenSettings }: HomePageProps) {
  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] w-full flex-col items-center justify-center px-4 py-8">
      <button
        type="button"
        onClick={onOpenSettings}
        title="Settings"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg border border-surface-container-high bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
      >
        <Settings className="h-[18px] w-[18px]" />
      </button>
      <div className="flex w-full max-w-[420px] flex-col items-center">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-lg border border-surface-container-high bg-surface-container">
            <Shield className="h-5 w-5 text-primary-container" />
          </div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="font-sans text-headline-lg font-semibold tracking-tight text-on-surface">
              Ash
            </span>
            <span className="rounded border border-surface-container-high bg-surface-container px-1.5 py-0.5 font-mono text-code-inline text-on-surface-variant">
              v1.0
            </span>
          </div>
          <p className="max-w-[340px] font-sans text-body-sm leading-relaxed text-on-surface-variant">
            Disposable peer-to-peer messaging. No database, no accounts, no logs.
          </p>
        </div>

        <RoomActionCard onEnterChat={onEnterChat} />

        <div className="mt-6 flex w-full flex-col gap-2.5 px-2">
          {explainerItems.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant" />
              <p className="font-sans text-caption leading-relaxed text-on-surface-variant">
                {text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-on-surface-variant/60">
          <span className="font-mono text-code-inline">Ash Protocol 1.0</span>
          <span>•</span>
          <span className="font-mono text-code-inline">P2P WebRTC DataChannel</span>
        </div>
      </div>
    </div>
  )
}

export default HomePage
