import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import GithubIcon from './github_icon'
import { staggerContainer, staggerItem } from '../lib/anim'

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
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto flex w-full max-w-6xl flex-col items-start gap-10 px-6 pb-24 pt-40 md:pt-48"
      >
        <motion.div
          variants={staggerItem}
          className="flex items-center gap-2 rounded-full border border-surface-container-high bg-surface-container-low/70 px-3 py-1 backdrop-blur-sm"
        >
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-primary-container shadow-[0_0_8px] shadow-primary-container"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="font-mono text-code-inline uppercase tracking-widest text-primary">
            Disposable E2EE · Peer-to-peer
          </span>
        </motion.div>

        <motion.h1
          variants={staggerItem}
          className="max-w-4xl font-sans text-display-md font-bold tracking-tight text-on-surface md:text-display-lg"
        >
          Chat that leaves
          <br />
          <span className="text-primary-container">
            no trace.
          </span>
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="max-w-2xl font-sans text-body-base leading-relaxed text-on-surface-variant"
        >
          Ash is a room that connects two browsers directly — the server only
          introduces you, then steps out of the way. Messages travel
          peer-to-peer over a WebRTC DataChannel, encrypted in the browser
          before they ever touch the wire.
        </motion.p>

        <motion.div
          variants={staggerItem}
          className="flex flex-wrap items-center gap-3"
        >
          <a
            href="#how"
            className="group inline-flex h-11 items-center gap-2 rounded-lg bg-primary-container px-5 font-sans text-body-sm-medium font-semibold text-on-primary transition-shadow hover:shadow-[0_0_24px] hover:shadow-primary-container/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            See how it works
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
          <a
            href="https://github.com/devansharora18/ash"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex h-11 items-center gap-2 rounded-lg border border-surface-container-high bg-surface-container px-5 font-sans text-body-sm-medium text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            <GithubIcon className="h-4 w-4 transition-transform duration-200 group-hover:rotate-6" />
            Source code
          </a>
        </motion.div>

        <motion.ul
          variants={staggerItem}
          className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2"
        >
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2 font-mono text-code-inline text-on-surface-variant"
            >
              <span className="text-primary-container">→</span>
              {feature}
            </li>
          ))}
        </motion.ul>
      </motion.div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-primary-container/20"
      />
    </section>
  )
}

export default Hero