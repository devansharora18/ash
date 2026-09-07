import { useRef, useState, type ChangeEvent } from 'react'
import {
  ArrowRight,
  CircleAlert,
  ClipboardPaste,
  DoorOpen,
  Loader2,
} from 'lucide-react'

import { createRoom } from '../../lib/signaling'

function sanitize(value: string) {
  return value.replace(/\s+/g, '').trim()
}

interface RoomActionCardProps {
  backendUrl: string
  onCreateRoom: (roomId: string) => void
  onJoinRoom: (roomId: string) => void
}

function RoomActionCard({
  backendUrl,
  onCreateRoom,
  onJoinRoom,
}: RoomActionCardProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setCode(sanitize(event.target.value))
  }

  const handlePaste = async () => {
    setError(null)
    try {
      const text = await navigator.clipboard.readText()
      if (text) setCode(sanitize(text))
    } catch {
      setError('Clipboard read permission denied')
    }
  }

  const handleCreate = async () => {
    if (creating) return
    setCreating(true)
    setError(null)
    try {
      const { roomId } = await createRoom(backendUrl)
      onCreateRoom(roomId)
    } catch {
      setError(
        `Could not reach the signaling server at ${backendUrl}. Check the backend URL in Settings.`,
      )
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = () => {
    const clean = code.trim()
    if (!/^[A-Za-z0-9_-]{4,64}$/.test(clean)) {
      setError('Enter a valid room ID')
      inputRef.current?.focus()
      return
    }
    setError(null)
    setJoining(true)
    setCode(clean)
    onJoinRoom(clean)
  }

  return (
    <div className="flex w-full flex-col gap-5 rounded-xl border border-surface-container-high bg-surface-container p-6">
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-on-background font-sans text-body-sm-medium font-semibold text-background transition-colors duration-150 hover:bg-secondary-fixed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating room…</span>
            </>
          ) : (
            <>
              <span>Create ephemeral room</span>
              <ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-code-inline text-on-surface-variant/80">
            Signaling: {backendUrl.replace(/^https?:\/\//, '')}
          </span>
          <span className="font-mono text-code-inline text-primary">
            relay
          </span>
        </div>
      </div>

      <div className="relative my-0.5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-container-high" />
        </div>
        <span className="relative bg-surface-container px-3 font-sans text-caption uppercase tracking-wider text-on-surface-variant">
          or join with a room ID
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="room-code-input"
              className="font-sans text-caption font-medium text-on-surface-variant"
            >
              Room ID
            </label>
            <span className="font-mono text-code-inline text-on-surface-variant/60">
              invite link or code
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              id="room-code-input"
              ref={inputRef}
              autoComplete="off"
              spellCheck={false}
              maxLength={64}
              placeholder="e.g. 8oJtCvIROEw"
              value={code}
              onChange={handleInput}
              className={`h-10 w-full rounded-lg border bg-surface-container-lowest pl-3.5 pr-16 font-mono text-[13px] uppercase tracking-wider text-on-surface transition-colors duration-150 placeholder:text-on-surface-variant/40 focus:outline-none ${
                error
                  ? 'border-error'
                  : 'border-surface-container-high focus:border-primary-container'
              }`}
            />
            <button
              type="button"
              onClick={handlePaste}
              title="Paste from clipboard"
              className="absolute right-1.5 flex h-7 items-center gap-1 rounded border border-surface-container-high bg-surface-container-high px-2 py-1 font-sans text-caption text-on-surface transition-colors duration-150 hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              <span>Paste</span>
            </button>
          </div>
          {error && (
            <div className="flex items-start gap-1.5 pt-1 text-error" role="alert">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="font-sans text-caption leading-snug">{error}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleJoin}
          disabled={joining}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-surface-container-high bg-surface-container-low font-sans text-body-sm-medium text-on-surface transition-colors duration-150 hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {joining ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Joining…</span>
            </>
          ) : (
            <>
              <span>Join room</span>
              <DoorOpen className="h-4 w-4 text-on-surface-variant" />
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-surface-container-high/60 pt-2 text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px] shadow-primary-container" />
          <span className="font-mono text-code-inline">Signaling ready</span>
        </div>
        <span className="font-mono text-code-inline">no accounts · no logs</span>
      </div>
    </div>
  )
}

export default RoomActionCard
