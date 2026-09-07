import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { staggerContainer, staggerItem } from '../lib/anim'

interface SectionShellProps {
  id: string
  eyebrow: string
  title: string
  lead?: string
  children: ReactNode
}

function SectionShell({ id, eyebrow, title, lead, children }: SectionShellProps) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-surface-container-high">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="flex max-w-2xl flex-col gap-3"
        >
          <motion.p
            variants={staggerItem}
            className="font-mono text-code-inline uppercase tracking-widest text-primary-container"
          >
            {eyebrow}
          </motion.p>
          <motion.h2
            variants={staggerItem}
            className="font-sans text-headline-lg font-semibold tracking-tight text-on-surface"
          >
            {title}
          </motion.h2>
          {lead && (
            <motion.p
              variants={staggerItem}
              className="font-sans text-body-base leading-relaxed text-on-surface-variant"
            >
              {lead}
            </motion.p>
          )}
        </motion.div>
        {children}
      </div>
    </section>
  )
}

export default SectionShell