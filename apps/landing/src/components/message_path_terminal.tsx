import { useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const LINES = [
  { text: '> encrypt(msg, key)', cls: 'text-primary-container' },
  { text: '> ciphertext over DataChannel', cls: 'text-on-surface-variant' },
  { text: '> decrypt(cipher, key)', cls: 'text-primary-container' },
  { text: '> plaintext', cls: 'text-on-surface' },
]

function MessagePathTerminal() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    if (!inView) return
    let count = 0
    const timer = setInterval(() => {
      count += 1
      setVisible(count)
      if (count >= LINES.length) clearInterval(timer)
    }, 420)
    return () => clearInterval(timer)
  }, [inView])

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-lowest/70 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-surface-container-high px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-secondary-container/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-teal/70" />
        </div>
        <span className="font-mono text-code-inline uppercase tracking-[0.22em] text-on-surface-variant">
          message path
        </span>
      </div>

      <div className="flex min-h-[132px] flex-col justify-center gap-1.5 p-5 font-mono text-code-inline">
        {LINES.slice(0, visible).map((line) => (
          <div key={line.text} className={line.cls}>
            {line.text}
          </div>
        ))}
        <span className="h-3.5 w-2 animate-pulse bg-primary-container" />
      </div>
    </div>
  )
}

export default MessagePathTerminal