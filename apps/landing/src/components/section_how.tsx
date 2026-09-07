import { useMotionValueEvent, useScroll } from 'framer-motion'
import { useRef, useState } from 'react'

import HandshakeDiagram from './handshake_diagram'
import SectionShell from './section_shell'

const steps = [
  {
    title: 'Create a room',
    body: 'The signaling server issues an unpredictable room ID and holds only temporary connection state. No account, no profile.',
  },
  {
    title: 'Share a link',
    body: 'Peers open the invite link in a browser. The server introduces them by relaying WebRTC handshake data.',
  },
  {
    title: 'Talk directly',
    body: 'Once connected, messages travel browser-to-browser over a WebRTC DataChannel. The server is out of the message path.',
  },
  {
    title: 'Leave, and it vanishes',
    body: 'When the last peer leaves, in-memory room state is discarded. Nothing was ever written to disk.',
  },
]

function How() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ['start 0.75', 'end 0.4'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const next = Math.max(0, Math.min(3, Math.round(value * 3)))
    setActive(next)
  })

  return (
    <SectionShell
      id="how"
      eyebrow="How it works"
      title="A room, not a server."
      lead="Ash uses a server for exactly one job: introducing peers. Once the direct connection exists, the server never touches your conversation again."
      width="wide"
    >
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:items-center lg:justify-center lg:gap-10">
          <HandshakeDiagram active={active} />
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <span
                  key={step.title}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === active
                      ? 'w-6 bg-primary-container'
                      : index < active
                        ? 'w-1.5 bg-primary-container/50'
                        : 'w-1.5 bg-surface-container-high'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-code-inline uppercase tracking-widest text-on-surface-variant">
              {steps[active]?.title}
            </span>
          </div>
        </div>

        <div ref={scrollRef} className="flex flex-col">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex min-h-[52vh] flex-col justify-center py-16 first:pt-0 last:min-h-0 last:py-0"
            >
              <div className="flex flex-col gap-4">
                <span className="font-mono text-code-inline text-primary-container">
                  0{index + 1} / 04
                </span>
                <h3 className="font-sans text-headline-lg font-semibold tracking-tight text-on-surface">
                  {step.title}
                </h3>
                <p className="max-w-md font-sans text-body-sm leading-relaxed text-on-surface-variant">
                  {step.body}
                </p>
                {index < steps.length - 1 && (
                  <div className="mt-6 h-px w-24 bg-surface-container-high" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

export default How