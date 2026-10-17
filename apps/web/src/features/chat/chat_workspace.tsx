import { useEffect, useRef, useState } from 'react'
import { Flame, Lock, Maximize2, Minimize2, MonitorUp } from 'lucide-react'

import Composer from './composer'
import MessageFeed, { type ChatMessage } from './message_feed'
import ShareView, { type ShareSource } from './share_view'
import Whiteboard, { type BoardStroke } from './whiteboard'

interface ChatWorkspaceProps {
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

function ChatWorkspace({
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
  }, [messages.length])

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
                <MessageFeed messages={messages} peersOnline={peersOnline} />
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
