import { ArrowRight } from 'lucide-react'

import GithubIcon from './github_icon'

const features = [
  'No accounts',
  'No message history',
  'No central database',
]

function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-surface-container-high"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-10 px-6 pb-24 pt-40 md:pt-48">
        <div className="flex items-center gap-2 rounded-full border border-surface-container-high bg-surface-container-low px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-container shadow-[0_0_6px] shadow-primary-container" />
          <span className="font-mono text-code-inline uppercase tracking-widest text-primary">
            Disposable E2EE · Peer-to-peer
          </span>
        </div>

        <h1 className="max-w-4xl font-sans text-display-md font-semibold tracking-tight text-on-surface md:text-display-lg">
          Chat that leaves
          <br />
          <span className="text-primary-container">no trace.</span>
        </h1>

        <p className="max-w-2xl font-sans text-body-lg leading-relaxed text-on-surface-variant">
          Ash is a room that connects two browsers directly — the server only
          introduces you, then steps out of the way. Messages travel
          peer-to-peer over a WebRTC DataChannel, encrypted in the browser
          before they ever touch the wire.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#how"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary-container px-5 font-sans text-body-sm-medium font-semibold text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            See how it works
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/devansharora18/ash"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-surface-container-high bg-surface-container px-5 font-sans text-body-sm-medium text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            <GithubIcon className="h-4 w-4" />
            Source code
          </a>
        </div>

        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2 font-mono text-code-inline text-on-surface-variant"
            >
              <span className="text-primary-container">→</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary-container/40 to-transparent"
      />
    </section>
  )
}

export default Hero
