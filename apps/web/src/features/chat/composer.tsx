import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

interface ComposerProps {
  onSend: (text: string) => void
}

function Composer({ onSend }: ComposerProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => {
    resize()
  }, [value])

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

  return (
    <div className="shrink-0 bg-surface-container-lowest p-4">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="rounded-xl bg-surface-container-low p-2.5 shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary-container">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write an encrypted message..."
              className="max-h-36 flex-1 resize-none bg-transparent px-1.5 py-1 font-sans text-body-sm text-on-surface placeholder:text-outline focus:outline-none"
            />
            <button
              type="button"
              onClick={send}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-on-surface px-3.5 font-sans text-body-sm-medium text-surface-container-lowest transition-colors hover:bg-inverse-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            >
              <span>Send</span>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between px-1 text-outline">
          <span className="font-sans text-caption">Shift + Enter for newline</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
            <span className="font-mono text-code-inline text-on-surface-variant">
              RAM-only buffer
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Composer
