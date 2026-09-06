import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  ArrowRight,
  CircleAlert,
  ClipboardPaste,
  DoorOpen,
  Loader2,
} from 'lucide-react'

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

function sanitize(value: string) {
  return value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase()
}

function RoomActionCard() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const rawLength = code.replace(/-/g, '').length

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setCode(sanitize(event.target.value))
  }

  const handlePaste = async () => {
    setError(null)
    try {
      const text = await navigator.clipboard.readText()
      if (text) setCode(sanitize(text).slice(0, 9))
    } catch {
      setError('Clipboard read permission denied')
    }
  }

  const handleJoin = () => {
    const clean = code.replace(/[^a-zA-Z0-9]/g, '')
    if (clean.length !== 6) {
      setError('Enter a valid 6-character room code')
      inputRef.current?.focus()
      return
    }
    setError(null)
    setJoining(true)
    timerRef.current = window.setTimeout(() => {
      setJoining(false)
      setError('Rendezvous peer negotiation failed. Room expired or offline.')
    }, 1200)
  }

  const handleCreate = () => {
    setCreating(true)
    timerRef.current = window.setTimeout(() => {
      let generated = ''
      for (let i = 0; i < 6; i++) {
        generated += CODE_ALPHABET.charAt(
          Math.floor(Math.random() * CODE_ALPHABET.length),
        )
      }
      setCode(`${generated.slice(0, 3)}-${generated.slice(3)}`)
      setCreating(false)
      setError(null)
    }, 600)
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
              <span>Generating cryptographic seeds...</span>
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
            Entropy mode: Ed25519
          </span>
          <span className="font-mono text-code-inline text-primary">
            WebRTC direct
          </span>
        </div>
      </div>

      <div className="relative my-0.5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-container-high" />
        </div>
        <span className="relative bg-surface-container px-3 font-sans text-caption uppercase tracking-wider text-on-surface-variant">
          or join with a code
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="room-code-input"
              className="font-sans text-caption font-medium text-on-surface-variant"
            >
              Room Code
            </label>
            <span
              className={`font-mono text-code-inline ${
                rawLength > 0 && rawLength < 6
                  ? 'text-primary'
                  : 'text-on-surface-variant/60'
              }`}
            >
              {rawLength}/6
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              id="room-code-input"
              ref={inputRef}
              autoComplete="off"
              spellCheck={false}
              maxLength={9}
              placeholder="e.g. 8492-X9"
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
            <div className="flex items-center gap-1.5 pt-1 text-error" role="alert">
              <CircleAlert className="h-3.5 w-3.5 shrink-0" />
              <span className="font-sans text-caption">{error}</span>
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
              <span>Resolving peer mesh...</span>
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
          <span className="font-mono text-code-inline">Mesh rendezvous ready</span>
        </div>
        <span className="font-mono text-code-inline">0 relays required</span>
      </div>
    </div>
  )
}

export default RoomActionCard
