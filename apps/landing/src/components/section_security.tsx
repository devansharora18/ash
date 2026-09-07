import { motion } from 'framer-motion'
import { useState } from 'react'

import MessagePathTerminal from './message_path_terminal'
import TopologyDiagram, { type TopologyFocus } from './topology_diagram'
import { staggerContainer, staggerItem } from '../lib/anim'
import SectionShell from './section_shell'

const facts = [
  {
    label: 'What the server sees',
    focus: 'signaling' as const,
    value: 'only connection metadata — room IDs, who joined, when. Never plaintext.',
  },
  {
    label: 'What the server stores',
    focus: 'none' as const,
    value: 'volatile in-memory state. Nothing written to disk, logs carry no message content.',
  },
  {
    label: 'Where encryption happens',
    focus: 'data' as const,
    value: 'in the browser, before a byte leaves the device.',
  },
]

function Security() {
  const [focus, setFocus] = useState<TopologyFocus>('none')

  return (
    <SectionShell
      id="security"
      eyebrow="Security model"
      title="The server never reads the conversation."
      lead="Peers agree on keys and encrypt locally with libsodium — X25519 key exchange and XSalsa20-Poly1305 authenticated encryption. The signaling path handles only handshake data."
      width="wide"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="grid gap-6 lg:grid-cols-5"
      >
        <div className="lg:col-span-3">
          <motion.div
            variants={staggerItem}
            onMouseEnter={() => setFocus('none')}
          >
            <TopologyDiagram focus={focus} />
          </motion.div>
          <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-high sm:grid-cols-3">
            {facts.map((fact) => (
              <div
                key={fact.label}
                onMouseEnter={() => setFocus(fact.focus)}
                onMouseLeave={() => setFocus('none')}
                className="cursor-default bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container"
              >
                <p className="font-mono text-code-inline uppercase tracking-wider text-primary-container">
                  {fact.label}
                </p>
                <p className="mt-1.5 font-sans text-caption leading-relaxed text-on-surface-variant">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <motion.div
            variants={staggerItem}
            onMouseEnter={() => setFocus('data')}
            onMouseLeave={() => setFocus('none')}
          >
            <MessagePathTerminal />
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="rounded-xl border border-surface-container-high bg-surface-container-lowest/70 p-6 backdrop-blur-sm"
          >
            <p className="font-mono text-code-inline uppercase tracking-widest text-on-surface-variant">
              honest limits
            </p>
            <ul className="mt-3 flex flex-col gap-2 font-sans text-caption leading-relaxed text-on-surface-variant">
              <li>Ash is privacy-oriented, not an anonymity network.</li>
              <li>A recipient can always copy or screenshot what they see.</li>
              <li>E2EE protects content, not connection metadata.</li>
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </SectionShell>
  )
}

export default Security