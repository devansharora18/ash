import { motion } from 'framer-motion'
import { UserX, History, Database } from 'lucide-react'

import LeaksDiagram from './leaks_diagram'
import { staggerContainer, staggerItem } from '../lib/anim'
import SectionShell from './section_shell'

const problems = [
  {
    icon: UserX,
    title: 'Accounts',
    body: 'Sign-up walls, profiles, friend graphs — identity baggage attached to the sender.',
  },
  {
    icon: History,
    title: 'History',
    body: 'Every message stored, indexed, searchable — a record that outlives the conversation.',
  },
  {
    icon: Database,
    title: 'A database',
    body: 'Your words parked on infrastructure you do not control, long after you are gone.',
  },
]

function Problem() {
  return (
    <SectionShell
      id="problem"
      eyebrow="The problem"
      title="Traditional chat assumes a permanent record."
      lead="Convenience features — accounts, history, sync, search — are built on persistent infrastructure that owns your words."
      width="wide"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="grid items-start gap-10 lg:grid-cols-[1.5fr_1fr]"
      >
        <motion.div variants={staggerItem}>
          <LeaksDiagram />
        </motion.div>

        <div className="flex flex-col gap-4">
          {problems.map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              variants={staggerItem}
              className="flex items-start gap-4 rounded-2xl border border-surface-container-high bg-surface-container-lowest/70 p-5 backdrop-blur-sm"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-surface-container-high bg-surface-container">
                <Icon className="h-4 w-4 text-primary-container" />
              </div>
              <div>
                <h3 className="font-sans text-headline-sm font-semibold tracking-tight text-on-surface">
                  {title}
                </h3>
                <p className="mt-1 font-sans text-body-sm leading-relaxed text-on-surface-variant">
                  {body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SectionShell>
  )
}

export default Problem