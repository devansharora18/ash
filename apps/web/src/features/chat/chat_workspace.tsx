import { useEffect, useRef, useState } from 'react'
import { Flame, Lock, Maximize2, Minimize2, MonitorUp } from 'lucide-react'

import Composer from './composer'
import MessageFeed, { type ChatMessage } from './message_feed'
import ShareView, { type ShareSource } from './share_view'
import Whiteboard, { type BoardStroke } from './whiteboard'

export type ChatView = 'chat' | 'empty' | 'loading'

interface ChatWorkspaceProps {
  view: ChatView
  onViewChange: (view: ChatView) => void
  roomId: string
  messages: ChatMessage[]
  peersOnline: number
  statusMessage: string | null
  onSend: (text: string) => void
  onFilePick: (file: File) => void
  onVoiceRecord: (blob: Blob, durationMs: number) => void
  onIncinerate: () => void
  strokes: BoardStroke[]
  onStrokeStart: (x: number, y: number, color: string, width: number) => void
  onStrokePoint: (x: number, y: number) => void
  onStrokeEnd: () => void
  onBoardClear: () => void
  sharingScreen: boolean
  onToggleScreenShare: () => void
  shareSources: ShareSource[]
}

const viewTabs: { key: ChatView; label: string }[] = [
  { key: 'chat', label: 'Feed' },
  { key: 'empty', label: 'Empty' },
  { key: 'loading', label: 'Skeleton' },
]

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-low">
        <Lock className="h-6 w-6 text-outline" />
      </div>
      <div className="space-y-1">
        <h2 className="font-sans text-headline-md font-medium text-on-surface">
          Session Initialized
        </h2>
        <p className="max-w-sm font-sans text-body-sm text-outline">
          Encrypted messages will appear here. Content is decrypted client-side
          and exists exclusively in volatile memory.
        </p>
      </div>
      <span className="rounded bg-surface-container-low px-2.5 py-1 font-mono text-code-inline text-primary-fixed-dim">
        Awaiting initial packet transmission...
      </span>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex animate-pulse flex-col space-y-5">
      <div className="flex w-2/3 flex-col items-start space-y-2">
        <div className="h-3 w-28 rounded bg-surface-container-low" />
        <div className="h-14 w-full rounded-xl rounded-tl-sm bg-surface-container-low" />
      </div>
      <div className="flex w-3/4 flex-col items-end self-end space-y-2">
        <div className="h-3 w-24 rounded bg-surface-container-low" />
        <div className="h-16 w-full rounded-xl rounded-tr-sm bg-surface-container-high" />
      </div>
      <div className="flex w-1/2 flex-col items-start space-y-2">
        <div className="h-3 w-32 rounded bg-surface-container-low" />
        <div className="h-10 w-full rounded-xl rounded-tl-sm bg-surface-container-low" />
      </div>
    </div>
  )
}

function ChatWorkspace({
  view,
  onViewChange,
  roomId,
  messages,
  peersOnline,
  statusMessage,
  onSend,
  onFilePick,
  onVoiceRecord,
  onIncinerate,
  strokes,
  onStrokeStart,
  onStrokePoint,
  onStrokeEnd,
  onBoardClear,
  sharingScreen,
  onToggleScreenShare,
  shareSources,
}: ChatWorkspaceProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [panelFullscreen, setPanelFullscreen] = useState(false)
  const hasShare = shareSources.length > 0

  useEffect(() => {
    const el = viewportRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length, view])

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-surface-container-lowest">
      <div className="flex h-12 shrink-0 items-center justify-between bg-surface-container-lowest px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate font-sans text-body-base-medium text-on-surface">
            #{roomId.slice(0, 8)}
          </span>
          <span className="rounded bg-surface-container-low px-2 py-0.5 font-mono text-code-inline text-on-surface-variant">
            {roomId}
          </span>
          <div className="hidden items-center gap-1.5 font-sans text-caption text-outline md:flex">
            <Lock className="h-3.5 w-3.5" />
            <span>RAM-only · zero disk persistence</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-surface-container-low p-0.5">
            {viewTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onViewChange(tab.key)}
                className={`rounded-lg px-2.5 py-1 font-sans text-caption transition-colors focus-visible:outline-2 focus-visible:outline-primary-container ${
                  view === tab.key
                    ? 'bg-surface-container-high font-medium text-on-surface'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            title={
              panelFullscreen
                ? 'Return to split view'
                : `Fullscreen ${hasShare ? 'screen share' : 'whiteboard'}`
            }
            onClick={() => setPanelFullscreen((v) => !v)}
            className="rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-container-low hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary-container"
          >
            {panelFullscreen ? (
              <Minimize2 className="h-[18px] w-[18px]" />
            ) : (
              <Maximize2 className="h-[18px] w-[18px]" />
            )}
          </button>
          <button
            type="button"
            title={sharingScreen ? 'Stop screen sharing' : 'Share your screen'}
            onClick={onToggleScreenShare}
            className={`rounded-lg p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-primary-container ${
              sharingScreen
                ? 'bg-primary-container/20 text-primary-fixed-dim'
                : 'text-outline hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <MonitorUp className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            title="Incinerate Session"
            onClick={onIncinerate}
            className="rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-container-low hover:text-error focus-visible:outline-2 focus-visible:outline-primary-container"
          >
            <Flame className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {!panelFullscreen && (
          <div className="flex min-w-0 flex-1 flex-col border-r border-surface-container-high">
            <div
              ref={viewportRef}
              className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto px-6 py-6"
            >
              <div className="mx-auto flex w-full max-w-[760px] flex-col space-y-4">
                {statusMessage && (
                  <div className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 font-sans text-caption text-on-surface-variant">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
                    {statusMessage}
                  </div>
                )}
                {view === 'chat' && (
                  <MessageFeed messages={messages} peersOnline={peersOnline} />
                )}
                {view === 'empty' && <EmptyState />}
                {view === 'loading' && <Skeleton />}
              </div>
            </div>
            <Composer
              onSend={onSend}
              onFilePick={onFilePick}
              onVoiceRecord={onVoiceRecord}
            />
          </div>
        )}
        {hasShare ? (
          <ShareView sources={shareSources} />
        ) : (
          <Whiteboard
            strokes={strokes}
            onStrokeStart={onStrokeStart}
            onStrokePoint={onStrokePoint}
            onStrokeEnd={onStrokeEnd}
            onClear={onBoardClear}
          />
        )}
      </div>
    </div>
  )
}

export default ChatWorkspace