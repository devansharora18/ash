import type { CSSProperties } from 'react'

import Reveal from './reveal'
import SectionHead from './section_head'
import { cn } from '../lib/cn'

const observations = [
  {
    label: 'What the server sees',
    body: 'Room names, who joined, and when. Never the message itself — there is nothing readable to hand over.',
  },
  {
    label: 'What the server stores',
    body: 'Nothing that outlives the room. State lives in memory and is dropped the moment the last peer leaves.',
    aside: 'no message log · no message database',
  },
  {
    label: 'Where sealing happens',
    body: 'On your device, before the first byte leaves it. The keys never travel alongside the message.',
  },
]

const specimen = [
  { label: 'as typed', value: 'meet at the north gate, 6:40' },
  { label: 'on the wire', value: 'kR7vQ2mXpLd9FzT4wB1nJcYe6aH8sUoGq3Vt' },
]

const limits = [
  'Ash is privacy-oriented, not an anonymity network. Connection metadata still exists.',
  'A recipient can always copy or screenshot what they see.',
  'End-to-end encryption protects what you say, not who you talked to.',
]

const row = (index: number) => ({ '--row': index }) as CSSProperties

function SectionSecurity() {
  return (
    <section id="security" className="scroll-mt-24 border-t border-hairline py-24 sm:py-28 lg:py-32">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <SectionHead
          numeral="04"
          eyebrow="The security model"
          title="The server never reads the conversation."
          lead="Everything is sealed on your device before it travels. What the server handles is closer to a switchboard: who to introduce, and nothing about what is said."
        />

        {/* Observed, stored, sealed — one sheet, three answers. */}
        <Reveal className="mt-16 lg:mt-20">
          <div className="grid gap-y-9 border-t-2 border-on-surface/70 pt-7 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
            {observations.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  'sm:border-hairline lg:border-l lg:pl-6',
                  index === 0 && 'lg:border-l-0 lg:pl-0',
                  index === 1 && 'sm:border-l sm:pl-6 lg:pl-6',
                )}
              >
                <p className="font-mono text-code-inline uppercase tracking-[0.16em] text-primary">
                  {item.label}
                </p>
                <p className="mt-3.5 font-sans text-body-base text-on-surface">{item.body}</p>

                {item.aside && (
                  <p className="mt-3 font-mono text-caption uppercase tracking-[0.14em] text-on-surface-variant">
                    {item.aside}
                  </p>
                )}

                {index === 2 && (
                  <dl className="mt-5 flex flex-col gap-4 font-mono text-caption">
                    {specimen.map((line) => (
                      <div key={line.label}>
                        <dt className="uppercase tracking-[0.16em] text-on-surface-variant/80">
                          {line.label}
                        </dt>
                        <dd
                          className={cn(
                            'mt-1.5 break-all',
                            line.label === 'on the wire' ? 'text-on-surface-variant' : 'text-on-surface',
                          )}
                        >
                          {line.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-10">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-code-inline text-on-surface-variant">
            <span className="uppercase tracking-[0.16em] text-primary">sealed with</span>
            <span>X25519 key exchange · XSalsa20-Poly1305 authenticated encryption · Ed25519 signatures</span>
          </p>
        </Reveal>

        {/* The limits belong on the page, in the margin, next to the claim. */}
        <div className="mt-16 grid gap-y-6 lg:mt-20 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-2">
            <p className="font-mono text-code-inline uppercase tracking-[0.16em] text-on-surface-variant">
              honest limits
            </p>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-8 lg:col-start-4">
            <ul>
              {limits.map((limit, index) => (
                <li
                  key={limit}
                  className="stagger-row border-t border-dashed border-outline-variant py-4 first:border-t-0 first:pt-0"
                  style={row(index)}
                >
                  <span className="font-sans text-body-sm text-on-surface-variant">{limit}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default SectionSecurity
