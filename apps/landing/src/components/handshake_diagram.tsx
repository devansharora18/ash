import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const PHASES = ['intro', 'talk'] as const
type Phase = (typeof PHASES)[number]

function Node({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex h-12 w-28 items-center justify-center rounded-lg border border-primary-container/40 bg-surface-container"
      >
        <span className="font-sans text-body-sm-medium text-on-surface">{label}</span>
      </motion.div>
      <span className="font-mono text-code-inline text-on-surface-variant">{sub}</span>
    </div>
  )
}

function HandshakeDiagram() {
  const [phase, setPhase] = useState<Phase>('intro')

  useEffect(() => {
    const timer = setTimeout(() => setPhase('talk'), 2600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-surface-container-high px-5 py-3">
        <span className="font-mono text-code-inline uppercase tracking-widest text-on-surface-variant">
          handshake
        </span>
        <span className="font-mono text-code-inline text-primary-container">
          {phase === 'intro' ? 'signaling…' : 'data channel live'}
        </span>
      </div>

      <div className="relative flex flex-col items-center justify-between gap-8 p-6 sm:flex-row sm:gap-4">
        <Node label="Browser A" sub="peer" />

        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2">
          {/* signaling leg: A -> server -> B, server glows then dims */}
          <div className="relative flex w-full items-center">
            <motion.div
              className="h-px flex-1 origin-right bg-primary-container/40"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            <motion.div
              className="mx-3 flex h-9 items-center rounded-md border border-primary-container/40 bg-surface-container px-3 font-mono text-code-inline text-on-surface-variant"
              animate={{
                boxShadow: phase === 'intro'
                  ? '0 0 18px 0 rgba(56,189,248,0.45)'
                  : '0 0 0 0 rgba(56,189,248,0)',
                borderColor: phase === 'intro' ? '#38bdf8' : '#333844',
              }}
              transition={{ duration: 1.2 }}
            >
              signaling server
            </motion.div>
            <motion.div
              className="h-px flex-1 origin-left bg-primary-container/40"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
          </div>
          <span className="font-mono text-code-inline text-on-surface-variant">
            introduces you, then steps out of the way
          </span>
        </div>

        <Node label="Browser B" sub="peer" />

        {/* direct P2P link that pulses once established */}
        <motion.div
          className="pointer-events-none absolute inset-0 sm:hidden"
          initial={{ opacity: 0 }}
          animate={phase === 'talk' ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="relative mx-auto h-full w-px bg-primary-container/70 shadow-[0_0_10px] shadow-primary-container">
            <motion.div
              className="absolute -left-[3px] h-[7px] w-[7px] rounded-full bg-primary-container shadow-[0_0_8px] shadow-primary-container"
              animate={
                phase === 'talk'
                  ? { top: ['0%', '100%', '0%'] }
                  : { top: '50%' }
              }
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>

        {/* direct P2P link that pulses once established */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 sm:block"
          initial={{ opacity: 0 }}
          animate={phase === 'talk' ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="relative mx-auto h-px w-[74%] bg-primary-container/70 shadow-[0_0_10px] shadow-primary-container">
            <motion.div
              className="absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-primary-container shadow-[0_0_8px] shadow-primary-container"
              animate={
                phase === 'talk'
                  ? { left: ['0%', '100%', '0%'] }
                  : { left: '50%' }
              }
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default HandshakeDiagram