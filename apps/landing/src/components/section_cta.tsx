import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import DissolveNetwork from './dissolve_network'
import SplitFlapText from './split_flap_text'
import { staggerContainer, staggerItem } from '../lib/anim'

const claims = ['no accounts', 'no history', 'no logs', 'no central database']

function SectionCta() {
  return (
    <section className="relative overflow-hidden border-b border-surface-container-high">
      <div className="relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-6 py-36"
        >
          <motion.h2
            variants={staggerItem}
            className="max-w-2xl font-sans text-headline-lg font-semibold tracking-tight text-on-surface"
          >
            Browsers own the conversation.
            <br />
            <span className="text-primary-container">Ash just introduces them.</span>
          </motion.h2>

          <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/devansharora18/ash"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-primary-container px-5 font-sans text-body-sm-medium font-semibold text-on-primary transition-shadow hover:shadow-[0_0_24px] hover:shadow-primary-container/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            >
              Explore the source
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </motion.div>

          <motion.div variants={staggerItem} className="w-full overflow-hidden">
            <SplitFlapText
              words={['NO ACCOUNTS', 'NO HISTORY', 'NO LOGS', 'NO CENTRAL DATABASE']}
              cycleDelay={2200}
              flipDuration={0.1}
              stagger={0.05}
              flipsPerChar={6}
              charset="alphanumeric"
              tileColor="#16161f"
              textColor="#38bdf8"
              tileRadius={6}
              gap={5}
              fontSize={34}
              loop
              padTo={19}
            />
          </motion.div>

          <motion.ul variants={staggerItem} className="flex flex-wrap gap-x-6 gap-y-2">
            {claims.map((claim) => (
              <li
                key={claim}
                className="flex items-center gap-2 font-mono text-code-inline text-on-surface-variant"
              >
                <span className="text-primary-container">→</span>
                {claim}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>

      <div className="absolute inset-0 opacity-40">
        <DissolveNetwork />
      </div>
    </section>
  )
}

export default SectionCta