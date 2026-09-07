import { useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const LINES: Array<{ text: string; cmd: boolean }> = [
  { text: '$ docker compose up -d', cmd: true },
  { text: '[+] Running 1/1', cmd: false },
  { text: ' ✔ Container ash-signaling  Started', cmd: false },
  { text: '$ curl http://localhost:8000/health', cmd: true },
  { text: '{"status":"ok"}', cmd: false },
]

function DeployTerminal() {
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
    }, 480)
    return () => clearInterval(timer)
  }, [inView])

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-lowest/80 shadow-[0_8px_32px] shadow-black/40 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-surface-container-high bg-surface-container-low px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-secondary-container/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-teal/70" />
        </div>
        <span className="font-mono text-code-inline text-on-surface-variant">ash — zsh</span>
      </div>

      <div className="flex min-h-[168px] flex-col justify-center gap-1.5 p-5 font-mono text-code-inline leading-relaxed">
        {LINES.slice(0, visible).map((line, index) => (
          <div key={index} className={line.cmd ? 'text-primary' : 'text-on-surface-variant'}>
            {line.text}
          </div>
        ))}
        <span className="h-3.5 w-2 animate-pulse bg-primary-container" />
      </div>
    </div>
  )
}

export default DeployTerminal