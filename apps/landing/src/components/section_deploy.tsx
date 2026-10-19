import type { CSSProperties } from 'react'

import Reveal from './reveal'
import SectionHead from './section_head'
import { cn } from '../lib/cn'
import { REPO_URL } from '../lib/links'

const steps = [
  {
    title: 'Get the code',
    body: 'Clone the repository or pull the container image. There is one small service to run and no database to provision.',
  },
  {
    title: 'Bring it up',
    body: 'One compose file starts the signaling server with a health check already wired in.',
  },
  {
    title: 'Give it an address',
    body: 'An outbound Cloudflare tunnel makes it reachable from anywhere, without opening a port on your router.',
  },
  {
    title: 'Take it down',
    body: 'Stop the container and you are done. Room state only ever lived in memory, so nothing is left behind.',
  },
]

const log = [
  { text: '$ docker compose up -d', tone: 'text-primary' },
  { text: '[+] running 1/1', tone: 'text-on-surface-variant' },
  { text: '[ok] ash-signaling  started in 0.6s', tone: 'text-teal' },
  { text: '$ curl -s localhost:8000/health', tone: 'text-primary' },
  { text: '{"status":"ok"}', tone: 'text-on-surface-variant' },
]

const notNeeded = [
  { label: 'a database', note: 'no store to provision, back up, or lose' },
  { label: 'a message queue', note: 'nothing buffered, nothing to replay' },
  { label: "someone else's servers", note: 'no managed service holding your metadata' },
]

const row = (index: number) => ({ '--row': index }) as CSSProperties

function SectionDeploy() {
  return (
    <section id="deploy" className="scroll-mt-24 border-t border-hairline py-24 sm:py-28 lg:py-32">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <SectionHead
          numeral="05"
          eyebrow="Run it yourself"
          title="Infrastructure you control."
          lead="There is no managed backend to trust and no account to create. The whole coordination layer is one unremarkable service you run yourself — then switch off whenever you like."
        />

        <div className="mt-16 grid gap-y-12 lg:mt-20 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-5">
            <ol>
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="stagger-row flex gap-5 border-t border-hairline py-6 first:border-t-2 first:border-on-surface/70 first:pt-6"
                  style={row(index)}
                >
                  <span className="w-6 shrink-0 font-display text-headline-sm leading-none text-primary tabular-nums">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="font-sans text-headline-sm font-semibold text-on-surface">
                      {step.title}
                    </h3>
                    <p className="mt-2.5 max-w-[42ch] font-sans text-body-sm text-on-surface-variant">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={140} className="lg:col-span-6 lg:col-start-7 lg:mt-6">
            <figure className="overflow-hidden rounded-lg border border-hairline bg-panel shadow-lift">
              <div className="flex items-center justify-between gap-4 border-b border-hairline bg-surface-container-low/60 px-4 py-3 sm:px-5">
                <span className="font-mono text-code-inline uppercase tracking-[0.16em] text-on-surface-variant">
                  on your machine
                </span>
                <span className="font-mono text-code-inline uppercase tracking-[0.16em] text-teal">
                  signaling only
                </span>
              </div>

              <ol className="flex flex-col gap-2 px-4 py-6 font-mono text-code-inline sm:px-5">
                {log.map((line, index) => (
                  <li key={line.text} className={cn('stagger-row', line.tone)} style={row(index)}>
                    {line.text}
                    {index === log.length - 1 && (
                      <span aria-hidden="true" className="caret ml-1.5" />
                    )}
                  </li>
                ))}
              </ol>

              <figcaption className="border-t border-hairline bg-surface-container-low/60 px-4 py-3 sm:px-5">
                <span className="font-mono text-code-inline uppercase tracking-[0.14em] text-on-surface-variant">
                  the tunnel dials out — nothing to expose
                </span>
              </figcaption>
            </figure>

            <p className="mt-4">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="link-wipe font-mono text-code-inline uppercase tracking-[0.14em] text-primary"
              >
                read the repository
              </a>
            </p>

            <div className="mt-12 border-t-2 border-on-surface/70 pt-6">
              <p className="font-mono text-code-inline uppercase tracking-[0.16em] text-on-surface-variant">
                and you do not need to run
              </p>
              <ul className="mt-4">
                {notNeeded.map((item, index) => (
                  <li
                    key={item.label}
                    className="stagger-row flex flex-col gap-1 border-b border-dashed border-outline-variant py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                    style={row(index + 5)}
                  >
                    <span className="font-sans text-body-sm text-on-surface">{item.label}</span>
                    <span className="font-mono text-caption text-on-surface-variant sm:text-right">
                      {item.note}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default SectionDeploy
