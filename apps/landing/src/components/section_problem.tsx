import { Database, History, UserX } from 'lucide-react'

import SectionShell from './section_shell'

const problems = [
  {
    icon: UserX,
    title: 'Accounts and identity baggage',
    body: 'Sign-up walls, profiles, friend graphs, and all the data those imply — the default cost of a "free" chat app.',
  },
  {
    icon: History,
    title: 'Server-side history',
    body: 'Every message is stored, indexed, searchable, and subpoena-able. The convenience of sync is paid for in permanence.',
  },
  {
    icon: Database,
    title: 'A database in the middle',
    body: 'The conversation lives on infrastructure you do not control, long after the conversation is over.',
  },
]

function Problem() {
  return (
    <SectionShell
      id="problem"
      eyebrow="The problem"
      title="Traditional chat assumes a permanent record."
      lead="Convenience features — accounts, history, sync, search — are built on persistent infrastructure that owns your words."
    >
      <div className="grid gap-px overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-high sm:grid-cols-3">
        {problems.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex flex-col gap-4 bg-surface-container-lowest p-6"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-container-high bg-surface-container">
              <Icon className="h-4 w-4 text-on-surface-variant" />
            </div>
            <h3 className="font-sans text-headline-md font-medium tracking-tight text-on-surface">
              {title}
            </h3>
            <p className="font-sans text-body-sm leading-relaxed text-on-surface-variant">
              {body}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

export default Problem
