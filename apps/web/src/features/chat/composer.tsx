import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { Mic, Paperclip, Send, Square, X } from 'lucide-react'

const MAX_VOICE_MS = 5 * 60 * 1000
const MIN_VOICE_MS = 500

function pickAudioMime(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? ''
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface ComposerProps {
  onSend: (text: string) => void
  onFilePick: (file: File) => void
  onVoiceRecord: (blob: Blob, durationMs: number) => void
}

function Composer({ onSend, onFilePick, onVoiceRecord }: ComposerProps) {
  const [value, setValue] = useState('')
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finalMs, setFinalMs] = useState(0)
  const [micError, setMicError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recordChunksRef = useRef<Blob[]>([])
  const recordStreamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recStartRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const autoStopRef = useRef<number | null>(null)
  const cancelRef = useRef(false)
  const blobRef = useRef<Blob | null>(null)
  const durationRef = useRef(0)

  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => {
    resize()
  }, [value])

  useEffect(() => {
    if (!micError) return
    const t = window.setTimeout(() => setMicError(null), 4000)
    return () => window.clearTimeout(t)
  }, [micError])

  useEffect(
    () => () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop()
        } catch {
          // ignore
        }
      }
      recordStreamRef.current?.getTracks().forEach((track) => track.stop())
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (autoStopRef.current) window.clearTimeout(autoStopRef.current)
    },
    [],
  )

  const send = () => {
    const text = value.trim()
    if (!text) return
    onSend(text)
    setValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onFilePick(file)
  }

  const finalizeRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (autoStopRef.current) {
      window.clearTimeout(autoStopRef.current)
      autoStopRef.current = null
    }
    recordStreamRef.current?.getTracks().forEach((track) => track.stop())
    recordStreamRef.current = null
    const recorder = recorderRef.current
    recorderRef.current = null
    if (!recorder) {
      setRecording(false)
      return
    }
    const durationMs = Math.min(Date.now() - recStartRef.current, MAX_VOICE_MS)
    setRecording(false)
    if (
      cancelRef.current ||
      recordChunksRef.current.length === 0 ||
      durationMs < MIN_VOICE_MS
    ) {
      cancelRef.current = false
      setRecorded(false)
      setFinalMs(0)
      blobRef.current = null
      return
    }
    blobRef.current = new Blob(recordChunksRef.current, {
      type: recorder.mimeType || 'audio/webm',
    })
    durationRef.current = durationMs
    setFinalMs(durationMs)
    setRecorded(true)
  }

  const startRecording = async () => {
    if (recording || recorded) return
    setMicError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, {
        mimeType: pickAudioMime() || undefined,
      })
      recordChunksRef.current = []
      recordStreamRef.current = stream
      recorderRef.current = recorder
      recStartRef.current = Date.now()
      cancelRef.current = false
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordChunksRef.current.push(event.data)
      }
      recorder.onstop = finalizeRecording
      recorder.start()
      setRecording(true)
      setRecorded(false)
      setElapsedMs(0)
      setFinalMs(0)
      timerRef.current = window.setInterval(
        () => setElapsedMs(Date.now() - recStartRef.current),
        250,
      )
      autoStopRef.current = window.setTimeout(
        () => recorder.stop(),
        MAX_VOICE_MS,
      )
    } catch {
      setMicError('Microphone access was denied or unavailable.')
    }
  }

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }

  const cancelRecording = () => {
    if (recording) {
      cancelRef.current = true
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      } else {
        finalizeRecording()
      }
    } else {
      setRecorded(false)
      setFinalMs(0)
      blobRef.current = null
    }
  }

  const handleVoiceSend = () => {
    if (!blobRef.current) return
    onVoiceRecord(blobRef.current, durationRef.current)
    blobRef.current = null
    setRecorded(false)
    setFinalMs(0)
  }

  const iconButtonCls =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary-container'

  return (
    <div className="shrink-0 bg-surface-container-lowest p-4">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="rounded-xl bg-surface-container-low p-2.5 shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary-container">
          {recording || recorded ? (
            <div className="flex items-center gap-2 py-0.5">
              <span
                className={`h-2 w-2 shrink-0 rounded-full bg-error ${
                  recording ? 'animate-pulse' : ''
                }`}
              />
              <span className="font-mono text-code-inline text-on-surface">
                {recorded ? formatDuration(finalMs) : formatDuration(elapsedMs)}
              </span>
              <span className="font-sans text-caption text-on-surface-variant">
                {recorded ? 'Ready to send' : 'Recording… max 5 min'}
              </span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={cancelRecording}
                title="Cancel voice message"
                className={iconButtonCls}
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={recorded ? handleVoiceSend : stopRecording}
                title={recorded ? 'Send voice message' : 'Stop recording'}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-on-surface px-3.5 font-sans text-body-sm-medium text-surface-container-lowest transition-colors hover:bg-inverse-surface focus-visible:outline-2 focus-visible:outline-primary-container"
              >
                {recorded ? <Send className="h-4 w-4" /> : <Square className="h-3.5 w-3.5" />}
                <span>{recorded ? 'Send' : 'Stop'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInput}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Send a file"
                className={iconButtonCls}
              >
                <Paperclip className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                onClick={() => void startRecording()}
                title="Record a voice message"
                className={iconButtonCls}
              >
                <Mic className="h-[18px] w-[18px]" />
              </button>
              <textarea
                ref={textareaRef}
                rows={1}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message..."
                className="max-h-36 flex-1 resize-none bg-transparent px-1.5 py-1 font-sans text-body-sm text-on-surface placeholder:text-outline focus:outline-none"
              />
              <button
                type="button"
                onClick={send}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-on-surface px-3.5 font-sans text-body-sm-medium text-surface-container-lowest transition-colors hover:bg-inverse-surface focus-visible:outline-2 focus-visible:outline-primary-container"
              >
                <span>Send</span>
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between px-1 text-outline">
          <span className="font-sans text-caption">
            {micError ?? 'Shift + Enter for newline'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
            <span className="font-mono text-code-inline text-on-surface-variant">
              P2P voice & file · WebRTC
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Composer