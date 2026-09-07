import { motion } from 'framer-motion'
import { Database, User } from 'lucide-react'

const MESSAGE_COUNT = 8
const STREAMS = 3

function LeaksDiagram() {
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-lowest/70 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-surface-container-high px-5 py-3">
        <span className="font-mono text-code-inline uppercase tracking-[0.22em] text-on-surface-variant">
          message trail
        </span>
        <span className="font-mono text-code-inline text-error">kept forever</span>
      </div>

      <div className="relative flex items-center justify-between gap-4 px-8 pb-12 pt-10 sm:px-10">
        {/* source: user */}
        <div className="flex w-40 shrink-0 flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-surface-container-high bg-surface-container">
            <User className="h-5 w-5 text-on-surface-variant" />
          </div>
          <span className="font-mono text-code-inline text-on-surface-variant">you</span>
        </div>

        {/* pipeline with messages travelling into storage */}
        <div className="relative flex flex-1 flex-col items-center gap-2">
          {/* growing pile */}
          <div className="flex h-24 items-end justify-center gap-1.5">
            {Array.from({ length: MESSAGE_COUNT }).map((_, i) => (
              <motion.div
                key={i}
                className="w-3 rounded-t-sm border border-surface-container-high bg-surface-container-high"
                style={{ height: 8 + i * 5 }}
                initial={{ opacity: 0, scaleY: 0.2, transformOrigin: 'bottom' }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.08, ease: 'easeOut' }}
              />
            ))}
          </div>

          {/* baseline + travelling messages */}
          <div className="relative h-px w-full bg-surface-container-high">
            {Array.from({ length: STREAMS }).map((_, stream) => (
              <motion.span
                key={stream}
                className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-on-surface-variant shadow-[0_0_8px] shadow-on-surface-variant/60"
                animate={{ left: ['-2%', '102%'] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: stream * 0.8,
                }}
              />
            ))}
          </div>
        </div>

        {/* database */}
        <div className="flex w-36 shrink-0 flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-error/40 bg-surface-container">
            <Database className="h-6 w-6 text-error" />
          </div>
          <span className="font-mono text-code-inline text-on-surface-variant">database</span>
        </div>
      </div>
    </div>
  )
}

export default LeaksDiagram