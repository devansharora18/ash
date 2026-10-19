import Reveal from './reveal'
import SectionHead from './section_head'
import { useReducedMotion } from '../lib/use_reduced_motion'
import { PROTOCOL_URL } from '../lib/links'

const steps = [
  {
    title: 'Make a room',
    body: 'Ash invents an unpredictable room name. No account, no email, no phone number — nothing that points back at you.',
  },
  {
    title: 'Send the link',
    body: "Your friend opens it in a browser. The server's only job is to tell the two of you where the other one is.",
  },
  {
    title: 'Talk directly',
    body: 'Messages are sealed on your device and travel straight to theirs. The server is not in the conversation.',
  },
  {
    title: 'Close the tab',
    body: 'The room forgets itself. Nothing was written to disk, so there is nothing left to find later.',
  },
]

const ARC = 'M 0 8 C 200 92, 800 92, 1000 8'

function SectionHow() {
  const reduced = useReducedMotion()

  return (
    <section id="how" className="scroll-mt-24 border-t border-hairline py-24 sm:py-28 lg:py-32">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <SectionHead
          numeral="03"
          eyebrow="How it works"
          title="The server makes the introduction, then steps out."
          leadAside
          lead="Ash uses a server for exactly one job: telling two browsers where the other one is. After that, your words go device to device, and the server has nothing to hold."
        />

        <div className="mt-16 grid gap-y-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 90} className="lg:pr-8">
              <div className="border-t border-hairline pt-5">
                <span className="font-display text-headline-sm leading-none text-primary tabular-nums">
                  0{index + 1}
                </span>
                <h3 className="mt-4 font-sans text-headline-sm font-semibold text-on-surface">
                  {step.title}
                </h3>
                <p className="mt-2.5 max-w-[38ch] font-sans text-body-sm text-on-surface-variant">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* The path: one handshake through the server, then a direct line. */}
        <Reveal className="mt-16 lg:mt-20">
          <figure className="overflow-hidden rounded-lg border border-hairline bg-panel shadow-lift">
            <div className="flex items-center justify-between gap-4 border-b border-hairline bg-surface-container-low/60 px-4 py-3 sm:px-5">
              <span className="font-mono text-code-inline uppercase tracking-[0.16em] text-on-surface-variant">
                message path
              </span>
              <span className="hidden font-mono text-code-inline uppercase tracking-[0.16em] text-primary sm:inline">
                two browsers, one short introduction
              </span>
            </div>

            <div className="px-4 py-9 sm:px-10 sm:py-12">
              <div className="relative">
                <div className="flex items-stretch justify-between gap-1.5 sm:gap-5">
                  <div className="flex w-14 shrink-0 flex-col items-center gap-2 sm:w-32">
                    <span className="w-full rounded-sm border border-on-surface/25 bg-surface-container-low px-1 py-2.5 text-center font-mono text-code-inline text-on-surface">
                      Peer A
                    </span>
                    <span className="font-mono text-caption text-on-surface-variant">you</span>
                  </div>

                  <div aria-hidden="true" className="flex flex-1 items-center">
                    <span className="hairline-draw dash-rule h-px w-full" />
                  </div>

                  <div className="dim-after flex w-20 shrink-0 flex-col items-center gap-2 sm:w-40">
                    <span className="w-full rounded-sm border border-dashed border-hairline bg-surface-container-low px-1 py-2.5 text-center font-mono text-code-inline text-on-surface-variant">
                      Signaling
                    </span>
                    <span className="font-mono text-caption text-on-surface-variant">handshake</span>
                  </div>

                  <div aria-hidden="true" className="flex flex-1 items-center">
                    <span className="hairline-draw dash-rule h-px w-full" />
                  </div>

                  <div className="flex w-14 shrink-0 flex-col items-center gap-2 sm:w-32">
                    <span className="w-full rounded-sm border border-on-surface/25 bg-surface-container-low px-1 py-2.5 text-center font-mono text-code-inline text-on-surface">
                      Peer B
                    </span>
                    <span className="font-mono text-caption text-on-surface-variant">them</span>
                  </div>
                </div>

                <div className="relative mt-4 h-20 sm:h-24">
                  <svg
                    viewBox="0 0 1000 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    className="absolute inset-y-0 left-7 right-7 overflow-visible sm:left-16 sm:right-16"
                  >
                    <path
                      d={ARC}
                      pathLength={1}
                      className="path-hit"
                      fill="none"
                      stroke="var(--color-primary-container)"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                    {!reduced && (
                      <circle r="3.5" fill="var(--color-primary-container)">
                        <animateMotion dur="4.2s" repeatCount="indefinite" path={ARC} />
                      </circle>
                    )}
                  </svg>

                  <span className="fade-in-after absolute inset-x-0 bottom-1 text-center font-mono text-code-inline uppercase tracking-[0.02em] text-on-surface-variant sm:tracking-[0.16em]">
                    <span className="text-primary">conversation</span> · sealed end to end · direct
                  </span>
                </div>
              </div>
            </div>

            <figcaption className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-hairline bg-surface-container-low/60 px-4 py-3 sm:px-5">
              <span className="font-mono text-code-inline uppercase tracking-[0.14em] text-on-surface-variant">
                the server carries addresses, never message bodies
              </span>
              <a
                href={PROTOCOL_URL}
                target="_blank"
                rel="noreferrer"
                className="link-wipe font-mono text-code-inline uppercase tracking-[0.14em] text-primary"
              >
                read the protocol reference
              </a>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  )
}

export default SectionHow
