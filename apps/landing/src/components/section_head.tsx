import type { ReactNode } from 'react'

import Reveal from './reveal'
import { cn } from '../lib/cn'

interface SectionHeadProps {
  numeral: string
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  /** Sets the lead as a standfirst in the right margin instead of under the headline. */
  leadAside?: boolean
  className?: string
}

/** Shared editorial masthead: hanging numeral, rule, eyebrow, display headline. */
function SectionHead({ numeral, eyebrow, title, lead, leadAside, className }: SectionHeadProps) {
  const eyebrowRow = (
    <Reveal className="flex items-center gap-3">
      <span className="font-display text-body-base leading-none text-primary tabular-nums">
        {numeral}
      </span>
      <span aria-hidden="true" className="h-px w-8 bg-primary-container/60" />
      <span className="font-mono text-code-inline uppercase tracking-[0.2em] text-on-surface-variant">
        {eyebrow}
      </span>
    </Reveal>
  )

  const headline = (delay: number) => (
    <Reveal delay={delay}>
      {/* max-w lives on the h2: `ch` must resolve against the display font, not the wrapper. */}
      <h2 className="max-w-[24ch] font-display text-display-md font-semibold text-balance text-on-surface">
        {title}
      </h2>
    </Reveal>
  )

  const deck = (delay: number, className?: string) => (
    <Reveal delay={delay} className={className}>
      <p className="max-w-[52ch] font-sans text-body-base text-on-surface-variant">{lead}</p>
    </Reveal>
  )

  if (leadAside) {
    return (
      <div className={cn('flex flex-col', className)}>
        {eyebrowRow}
        <div className="mt-6 grid gap-y-7 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-7">{headline(90)}</div>
          {lead && deck(170, 'lg:col-span-4 lg:col-start-9 lg:pt-3')}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {eyebrowRow}
      <div className="mt-6">{headline(90)}</div>
      {lead && deck(170, 'mt-6')}
    </div>
  )
}

export default SectionHead
