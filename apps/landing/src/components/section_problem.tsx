import type { CSSProperties } from 'react'

import Reveal from './reveal'
import SectionHead from './section_head'

const kept = [
  { label: 'Account, email or phone number', value: 'Required' },
  { label: 'Every message you send', value: 'Stored' },
  { label: 'Who you talk to, and when', value: 'Logged' },
  { label: 'Searchable history', value: 'Indexed' },
  { label: 'Backups you never see', value: 'Replicated' },
]

const notKept = [
  { label: 'Account, email or phone number', value: 'None' },
  { label: 'Every message you send', value: 'Not stored' },
  { label: 'Who you talk to, and when', value: 'Not logged' },
  { label: 'Searchable history', value: 'Does not exist' },
  { label: 'Backups you never see', value: 'None' },
]

const row = (index: number) => ({ '--row': index }) as CSSProperties

function SectionProblem() {
  return (
    <section id="problem" className="scroll-mt-24 border-t border-hairline py-24 sm:py-28 lg:py-32">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <SectionHead
          numeral="02"
          eyebrow="The problem"
          title="Every other messenger keeps a copy. That copy is the liability."
          lead="Whatever is stored somewhere can later be read, sold, seized, or spilled in a breach. You cannot lose what was never written down."
        />

        <div className="mt-16 grid gap-y-14 lg:mt-20 lg:grid-cols-12 lg:gap-x-10">
          {/* What a conventional messenger retains */}
          <Reveal className="lg:col-span-6 lg:col-start-1">
            <div className="flex items-baseline justify-between gap-4 border-b-2 border-on-surface/70 pb-3">
              <h3 className="font-sans text-headline-sm font-semibold text-on-surface">
                A normal chat app
              </h3>
              <span className="font-mono text-code-inline uppercase tracking-[0.16em] text-on-surface-variant">
                what it retains
              </span>
            </div>

            <ul className="mt-1">
              {kept.map((item, index) => (
                <li
                  key={item.label}
                  className="stagger-row flex items-baseline justify-between gap-6 border-b border-hairline py-3.5"
                  style={row(index)}
                >
                  <span className="font-sans text-body-sm text-on-surface-variant">{item.label}</span>
                  <span className="shrink-0 font-mono text-code-inline uppercase tracking-[0.12em] text-on-surface">
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>

            <div className="stagger-row mt-6 flex items-end justify-between gap-6" style={row(5)}>
              <span className="font-sans text-body-sm text-on-surface-variant">
                Kept, for good measure
              </span>
              <span className="font-display text-headline-md font-semibold text-on-surface">
                forever
              </span>
            </div>

            <div className="stagger-row mt-10" style={row(7)}>
              <span className="stamp">kept forever</span>
            </div>
          </Reveal>

          {/* What Ash retains — same questions, offset and charred */}
          <Reveal delay={160} className="char-shadow relative lg:col-span-5 lg:col-start-8 lg:mt-24">
            <div className="torn rounded-lg border border-hairline bg-panel px-5 pb-10 pt-5 shadow-panel">
              <div className="flex items-baseline justify-between gap-4 border-b-2 border-primary-container pb-3">
                <h3 className="font-sans text-headline-sm font-semibold text-on-surface">Ash</h3>
                <span className="font-mono text-code-inline uppercase tracking-[0.16em] text-primary">
                  what it retains
                </span>
              </div>

              <ul className="mt-1">
                {notKept.map((item, index) => (
                  <li
                    key={item.label}
                    className="stagger-row flex items-baseline justify-between gap-6 border-b border-hairline py-3.5"
                    style={row(index + 2)}
                  >
                    <span className="font-sans text-body-sm text-on-surface-variant">
                      {item.label}
                    </span>
                    <span className="shrink-0 font-mono text-code-inline uppercase tracking-[0.12em] text-on-surface">
                      {item.value}
                    </span>
                  </li>
                ))}
              </ul>

              <div
                className="stagger-row mt-6 flex items-end justify-between gap-6"
                style={row(8)}
              >
                <span className="font-sans text-body-sm text-on-surface-variant">
                  Total retained
                </span>
                <span className="font-display text-headline-md font-semibold text-primary">
                  0 bytes
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default SectionProblem
