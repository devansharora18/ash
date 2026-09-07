import type { ReactNode } from 'react'

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
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="font-mono text-code-inline uppercase tracking-widest text-primary-container">
            {eyebrow}
          </p>
          <h2 className="font-sans text-headline-lg font-semibold tracking-tight text-on-surface">
            {title}
          </h2>
          {lead && (
            <p className="font-sans text-body-base leading-relaxed text-on-surface-variant">
              {lead}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}

export default SectionShell
