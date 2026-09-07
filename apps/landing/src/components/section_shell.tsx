import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { cn } from '../lib/cn'
import { staggerContainer, staggerItem } from '../lib/anim'

interface SectionShellProps {
  id: string
  eyebrow: string
  title: string
  lead?: string
  children: ReactNode
  width?: 'narrow' | 'wide'
}

function SectionShell({
  id,
  eyebrow,
  title,
  lead,
  children,
  width = 'narrow',
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 py-28 sm:py-36',
        width === 'narrow' ? 'mx-auto max-w-5xl' : 'mx-auto max-w-6xl',
      )}
    >
      <div className="flex flex-col gap-14 px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="flex max-w-2xl flex-col gap-5"
        >
          <motion.p
            variants={staggerItem}
            className="font-mono text-code-inline uppercase tracking-[0.22em] text-secondary"
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
              className="max-w-xl font-sans text-body-sm leading-relaxed text-on-surface-variant"
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