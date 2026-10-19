import type { CSSProperties } from 'react'

import Arrow from './arrow'
import { APP_URL } from '../lib/links'

/** Style helper: `--i` drives the staggered load cascade (.rise in index.css). */
const at = (step: number) => ({ '--i': step }) as CSSProperties

const transcript = [
  { who: 'Mara', at: '18:03', text: 'Meet at the north gate, 6:40.' },
  { who: 'You', at: '18:04', text: 'Bringing the drive. Nothing on paper.' },
  { who: 'Mara', at: '18:04', text: 'Good. Then we never spoke.' },
]

const ledger = [
  'No accounts',
  'No history',
  'No copy on a server',
  'No phone number',
  'Nothing to hand over',
]

function Hero() {
  return (
    <section id="top" className="relative pb-14 pt-32 sm:pt-40 lg:pb-20 lg:pt-44">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-11 lg:row-start-1 lg:pb-8">
            <p className="rise flex items-center gap-2.5" style={at(0)}>
              <span aria-hidden="true" className="live-dot h-1.5 w-1.5 rounded-full bg-primary-container" />
              <span className="font-mono text-code-inline uppercase tracking-[0.2em] text-primary">
                A private room between two browsers
              </span>
            </p>

            <h1
              className="rise mt-7 max-w-[12ch] font-display text-display-lg font-semibold text-balance text-on-surface"
              style={at(1)}
            >
              Say it once.{' '}
              <span className="italic text-primary decoration-primary-container/40 decoration-2 underline-offset-[0.12em]">
                Watch it burn.
              </span>
            </h1>
          </div>

          <div className="lg:col-span-4 lg:col-start-1 lg:row-start-2">
            <p
              className="rise max-w-[44ch] font-sans text-body-base text-on-surface-variant"
              style={at(2)}
            >
              Ash opens a private room between two browsers. No sign-up, no
              archive, no copy on a server — messages are sealed on your device
              before they travel. When the last person closes the tab, the room
              is gone, and so is everything said in it.
            </p>

            <div className="rise mt-8 flex flex-wrap items-center gap-3" style={at(4)}>
              <a
                href={APP_URL}
                className="group inline-flex h-11 items-center gap-2.5 rounded-sm bg-primary-container px-5 font-sans text-body-sm-medium text-on-primary transition-colors duration-300 hover:bg-on-surface hover:text-background active:translate-y-px"
              >
                Start a room
                <Arrow />
              </a>
              <a
                href="#how"
                className="inline-flex h-11 items-center rounded-sm border border-hairline px-5 font-sans text-body-sm-medium text-on-surface transition-colors duration-300 hover:border-primary hover:text-primary active:translate-y-px"
              >
                How it works
              </a>
            </div>

            <p
              className="rise mt-4 font-mono text-code-inline text-on-surface-variant/80"
              style={at(5)}
            >
              One tab. Nothing to install.
            </p>
          </div>

          {/* Signature: the room that eats its own messages. */}
          <figure
            className="rise lg:col-span-7 lg:col-start-6 lg:row-start-2 lg:-mt-10 xl:-mt-16"
            style={at(3)}
          >
            <div className="char-shadow relative rotate-[-0.7deg] transition-transform duration-700 ease-expo hover:rotate-0">
              <div className="torn overflow-hidden rounded-lg border border-hairline bg-panel shadow-panel">
                <figcaption className="flex items-center justify-between gap-4 border-b border-hairline bg-surface-container-low/50 px-4 py-2.5 sm:px-5">
                  <span className="flex min-w-0 items-center gap-2 font-mono text-code-inline uppercase tracking-[0.14em] text-on-surface-variant">
                    <span aria-hidden="true" className="live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                    <span className="truncate">quiet-river-4f2c</span>
                  </span>
                  <span className="shrink-0 font-mono text-code-inline uppercase tracking-[0.14em] text-on-surface-variant">
                    2 peers
                  </span>
                </figcaption>

                <ol className="px-4 sm:px-5">
                  {transcript.map((line, index) => (
                    <li
                      key={line.text}
                      className="relative border-b border-hairline py-3.5 last:border-b-0"
                    >
                      <span aria-hidden="true" className="msg-residue" style={at(index)} />
                      <div className="msg relative" style={at(index)}>
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="font-mono text-code-inline uppercase tracking-[0.12em] text-on-surface">
                            {line.who}
                          </span>
                          <span className="font-mono text-caption text-on-surface-variant/80">
                            {line.at}
                          </span>
                        </div>
                        <p className="mt-1 font-sans text-body-sm text-on-surface-variant">
                          {line.text}
                        </p>
                        <span aria-hidden="true" className="msg-ember" />
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-hairline bg-surface-container-low/50 px-4 py-2.5 font-mono text-code-inline uppercase tracking-[0.12em] text-on-surface-variant sm:px-5">
                  <span>Expires when the last peer leaves</span>
                  <span className="text-primary">0 b written to disk</span>
                </div>
              </div>
            </div>
          </figure>
        </div>

        <ul className="mt-14 flex flex-wrap border-t border-hairline sm:mt-20">
          {ledger.map((item) => (
            <li
              key={item}
              className="flex w-full items-center gap-2.5 border-b border-hairline py-3 pr-4 font-mono text-code-inline uppercase tracking-[0.14em] text-on-surface-variant sm:w-auto sm:border-b-0 sm:border-r sm:pl-5 sm:first:pl-0 sm:last:border-r-0"
            >
              <span aria-hidden="true" className="h-2.5 w-px shrink-0 bg-primary-container/70" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Hero
