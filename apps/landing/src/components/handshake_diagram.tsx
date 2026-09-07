import { motion } from 'framer-motion'
import { Monitor, Server } from 'lucide-react'

interface HandshakeDiagramProps {
  active: number
}

function PeerNode({ label, dim }: { label: string; dim: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="flex h-12 w-28 items-center justify-center gap-2 rounded-lg border border-surface-container-high bg-surface-container"
        animate={{ opacity: dim ? 0.35 : 1, scale: dim ? 0.95 : 1 }}
        transition={{ duration: 0.5 }}
      >
        <Monitor className="h-4 w-4 text-on-surface-variant" />
        <span className="font-sans text-body-sm-medium text-on-surface">{label}</span>
      </motion.div>
      <span className="font-mono text-code-inline text-on-surface-variant">peer</span>
    </div>
  )
}

function HandshakeDiagram({ active }: HandshakeDiagramProps) {
  const signaling = active >= 1
  const direct = active >= 2
  const gone = active >= 3

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-lowest/70 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-surface-container-high px-5 py-3">
        <span className="font-mono text-code-inline uppercase tracking-[0.22em] text-on-surface-variant">
          handshake
        </span>
        <motion.span
          className="font-mono text-code-inline text-primary-container"
          animate={{ opacity: gone ? 0.3 : 1 }}
        >
          {active === 0 && 'room created'}
          {active === 1 && 'signaling…'}
          {active === 2 && 'data channel live'}
          {active === 3 && 'room destroyed'}
        </motion.span>
      </div>

      <div className="relative flex flex-col items-center justify-between gap-8 p-8 sm:flex-row sm:gap-4">
        <PeerNode label="Browser A" dim={gone} />

        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2">
          {/* signaling leg: A -> server -> B */}
          <div className="relative flex w-full items-center">
            <motion.div
              className="h-px flex-1 origin-right border-t border-dashed border-primary-container/50"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: signaling && !gone ? 1 : 0 }}
              transition={{ duration: 0.7, delay: signaling ? 0.2 : 0 }}
            />
            <motion.div
              className="mx-3 flex h-9 items-center gap-1.5 rounded-md border border-surface-container-high bg-surface-container px-3"
              animate={{
                borderColor: signaling && !gone ? '#38bdf8' : '#333844',
                boxShadow: signaling && !gone
                  ? '0 0 18px 0 rgba(56,189,248,0.35)'
                  : '0 0 0 0 rgba(56,189,248,0)',
                opacity: gone ? 0.2 : 1,
              }}
              transition={{ duration: 0.8 }}
            >
              <Server className="h-3.5 w-3.5 text-primary-container" />
              <span className="font-mono text-code-inline text-on-surface-variant">
                signaling
              </span>
            </motion.div>
            <motion.div
              className="h-px flex-1 origin-left border-t border-dashed border-primary-container/50"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: signaling && !gone ? 1 : 0 }}
              transition={{ duration: 0.7, delay: signaling ? 0.35 : 0 }}
            />
          </div>
          <motion.span
            className="font-mono text-code-inline text-on-surface-variant"
            animate={{ opacity: signaling && !gone ? 1 : 0.3 }}
          >
            introduces you, then steps out of the way
          </motion.span>
        </div>

        <PeerNode label="Browser B" dim={gone} />

        {/* direct P2P link */}
        <motion.div
          className="pointer-events-none absolute inset-0 sm:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: direct ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative mx-auto h-full w-px bg-primary-container shadow-[0_0_12px] shadow-primary-container">
            <motion.div
              className="absolute -left-[3px] h-[7px] w-[7px] rounded-full bg-primary-container shadow-[0_0_8px] shadow-primary-container"
              animate={
                direct && !gone
                  ? { top: ['0%', '100%', '0%'] }
                  : { top: '50%', opacity: gone ? 0 : 1 }
              }
              transition={
                direct && !gone
                  ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
            />
          </div>
        </motion.div>

        {/* direct P2P link */}
        <motion.div
          className="pointer-events-none absolute inset-x-6 top-1/2 hidden -translate-y-1/2 sm:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: direct ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative h-px bg-primary-container shadow-[0_0_12px] shadow-primary-container">
            <motion.div
              className="absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-primary-container shadow-[0_0_8px] shadow-primary-container"
              animate={
                direct && !gone
                  ? { left: ['0%', '100%', '0%'] }
                  : { left: '50%', opacity: gone ? 0 : 1 }
              }
              transition={
                direct && !gone
                  ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default HandshakeDiagram