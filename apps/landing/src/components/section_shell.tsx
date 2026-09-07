import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import DecryptedText from './decrypted_text'
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
        'scroll-mt-24 py-20 sm:py-24',
        width === 'narrow' ? 'mx-auto max-w-5xl' : 'mx-auto max-w-6xl',
      )}
    >
      <div className="flex flex-col gap-10 px-6 sm:gap-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="flex max-w-2xl flex-col gap-4"
        >
          <motion.p
            variants={staggerItem}
            className="font-mono text-caption uppercase tracking-[0.22em] text-secondary"
          >
            {eyebrow}
          </motion.p>
          <motion.h2
            variants={staggerItem}
            className="font-sans text-headline-lg font-semibold tracking-tight text-on-surface"
          >
            <DecryptedText
              text={title}
              animateOn="view"
              sequential
              revealDirection="center"
              speed={30}
              className="text-on-surface"
              encryptedClassName="text-on-surface-variant/70"
            />
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