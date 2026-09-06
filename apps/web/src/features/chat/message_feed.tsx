import { CheckCheck, Lock, ShieldCheck } from 'lucide-react'

export interface ChatMessage {
  id: number
  author: string
  time: string
  text: string
  self: boolean
  mono?: boolean
}

const seededMessages: ChatMessage[] = [
  {
    id: 1,
    author: 'cipher_wolf',
    time: '14:22:04',
    text: 'Verified ECDH key exchange. Ratchet state synchronized across all 3 nodes.',
    self: false,
  },
  {
    id: 2,
    author: 'You',
    time: '14:23:18',
    text: 'Confirmed. Memory-only buffer active. Zero disk persistence configured for this namespace.',
    self: true,
  },
  {
    id: 3,
    author: '0x8b32...d9a',
    time: '14:24:02',
    text: 'Stream ready. Decryption cycles benchmarked at 0.18ms per payload block.',
    self: false,
    mono: true,
  },
]

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
        {message.text}
      </div>
    </div>
  )
}

interface MessageFeedProps {
  sentMessages: ChatMessage[]
}

function MessageFeed({ sentMessages }: MessageFeedProps) {
  return (
    <div className="flex flex-col space-y-4" id="container-chat-feed">
      <div className="my-2 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5 text-outline">
          <ShieldCheck className="h-4 w-4 text-primary-fixed-dim" />
          <span className="font-mono text-code-inline text-on-surface-variant">
            Keys negotiated. Ephemeral mesh established.
          </span>
        </div>
      </div>

      {seededMessages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      <div className="flex flex-col space-y-4">
        {sentMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    </div>
  )
}

export default MessageFeed
