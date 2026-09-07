import { CheckCheck, Lock, ShieldCheck } from 'lucide-react'

export interface ChatMessage {
  id: number
  author: string
  time: string
  text: string
  self: boolean
  mono?: boolean
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
        {message.text}
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
