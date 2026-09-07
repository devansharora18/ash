import { useEffect, useRef, useState } from 'react'
import { CheckCheck, Lock, Mic, Pause, Play, ShieldCheck } from 'lucide-react'

export interface ChatMessage {
  id: number
  author: string
  time: string
  text?: string
  self: boolean
  mono?: boolean
  voice?: { url: string; durationMs: number }
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function VoiceBubble({
  url,
  durationMs,
}: {
  url: string
  durationMs: number
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentSec, setCurrentSec] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration)
      setCurrentSec(audio.currentTime)
    }
    const onEnd = () => {
      setPlaying(false)
      setProgress(0)
      setCurrentSec(0)
      audio.currentTime = 0
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('play', () => setPlaying(true))
    audio.addEventListener('pause', () => setPlaying(false))
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('play', () => setPlaying(true))
      audio.removeEventListener('pause', () => setPlaying(false))
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      void audio.play()
    }
  }

  const shownMs = (playing ? currentSec * 1000 : durationMs) || durationMs
  const pct = Math.round(progress * 100)

  return (
    <div className="flex min-w-[220px] items-center gap-2.5">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        title={playing ? 'Pause' : 'Play'}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-on-surface text-surface-container-lowest transition-colors hover:bg-inverse-surface focus-visible:outline-2 focus-visible:outline-primary-container"
      >
        {playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="ml-0.5 h-4 w-4" />
        )}
      </button>
      <div className="flex-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant/40">
          <div
            className="h-full rounded-full bg-primary-fixed-dim transition-[width] duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="font-mono text-code-inline text-on-surface-variant">
        {formatDuration(shownMs)}
      </span>
      <Mic className="h-3.5 w-3.5 text-on-surface-variant" />
    </div>
  )
}

function MetaRow({ message }: { message: ChatMessage }) {
  if (message.self) {
    return (
      <div className="mb-1 flex items-center gap-2 px-1 font-sans text-caption text-outline">
        <span className="font-mono">{message.time}</span>
        <span>•</span>
        <span className="font-medium text-primary-fixed-dim">You</span>
        <CheckCheck className="h-3 w-3 text-primary-fixed-dim" />
      </div>
    )
  }
  return (
    <div className="mb-1 flex items-center gap-2 px-1 font-sans text-caption text-outline">
      <span
        className={`text-on-surface ${message.mono ? 'font-mono' : 'font-medium'}`}
      >
        {message.author}
      </span>
      <span>•</span>
      <span className="font-mono">{message.time}</span>
      <Lock className="h-3 w-3 text-primary-fixed-dim" />
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div
      className={`flex max-w-[85%] flex-col ${
        message.self ? 'items-end self-end' : 'items-start'
      }`}
    >
      <MetaRow message={message} />
      <div
        className={`rounded-xl p-3 font-sans text-body-sm leading-relaxed shadow-sm text-on-surface ${
          message.self
            ? 'rounded-tr-sm bg-surface-container-high'
            : 'rounded-tl-sm bg-surface-container-low'
        }`}
      >
        {message.voice ? (
          <VoiceBubble
            url={message.voice.url}
            durationMs={message.voice.durationMs}
          />
        ) : (
          message.text
        )}
      </div>
    </div>
  )
}

interface MessageFeedProps {
  messages: ChatMessage[]
  peersOnline: number
}

function MessageFeed({ messages, peersOnline }: MessageFeedProps) {
  return (
    <div className="flex flex-col space-y-4" id="container-chat-feed">
      <div className="my-2 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5 text-outline">
          <ShieldCheck className="h-4 w-4 text-primary-fixed-dim" />
          <span className="font-mono text-code-inline text-on-surface-variant">
            {peersOnline > 0
              ? `${peersOnline} peer${peersOnline === 1 ? '' : 's'} connected · WebRTC DataChannel`
              : 'Connected · waiting for a peer to connect'}
          </span>
        </div>
      </div>

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  )
}

export default MessageFeed