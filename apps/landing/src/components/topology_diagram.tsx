import { motion } from 'framer-motion'

export type TopologyFocus = 'none' | 'signaling' | 'data'

interface TopologyDiagramProps {
  focus: TopologyFocus
}

function TopologyDiagram({ focus }: TopologyDiagramProps) {
  const signalingDim = focus === 'data'
  const peersDim = focus === 'signaling'
  const dataGlow = focus === 'data'

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-lowest/70 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-surface-container-high px-5 py-3">
        <span className="font-mono text-code-inline uppercase tracking-[0.22em] text-on-surface-variant">
          topology
        </span>
        <span className="font-mono text-code-inline text-primary-container">full mesh</span>
      </div>

      <div className="flex flex-col gap-6 p-8 font-mono text-code-inline sm:flex-row sm:items-stretch sm:justify-between">
        <motion.div
          className="flex flex-col items-center gap-3"
          animate={{ opacity: peersDim ? 0.35 : 1 }}
        >
          <div className="flex h-11 w-28 items-center justify-center rounded-lg border border-surface-container-high bg-surface-container">
            <span className="text-on-surface">Peer A</span>
          </div>
          <span className="text-on-surface-variant">(browser)</span>
        </motion.div>

        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2">
          <div className="flex w-full items-center justify-center gap-2">
            <motion.span
              className="h-px flex-1"
              animate={{
                backgroundColor: dataGlow ? 'rgba(56,189,248,0.7)' : 'rgba(44,49,61,1)',
                boxShadow: dataGlow ? '0 0 8px rgba(56,189,248,0.5)' : 'none',
              }}
            />
            <motion.span
              className="rounded border border-surface-container-high bg-surface-container px-2 py-1 text-on-surface-variant"
              animate={{ opacity: signalingDim ? 0.3 : 1 }}
            >
              signaling
            </motion.span>
            <motion.span
              className="h-px flex-1"
              animate={{
                backgroundColor: dataGlow ? 'rgba(56,189,248,0.7)' : 'rgba(44,49,61,1)',
                boxShadow: dataGlow ? '0 0 8px rgba(56,189,248,0.5)' : 'none',
              }}
            />
          </div>
          <motion.span
            className="rounded border border-surface-container-high bg-surface-container px-2 py-1 text-on-surface-variant"
            animate={{ opacity: signalingDim ? 0.3 : 1 }}
          >
            SDP · ICE
          </motion.span>
          <div className="flex w-full items-center gap-2">
            <motion.span
              className="h-px flex-1"
              animate={{
                backgroundColor: dataGlow ? 'rgba(56,189,248,0.7)' : 'rgba(44,49,61,1)',
                boxShadow: dataGlow ? '0 0 8px rgba(56,189,248,0.5)' : 'none',
              }}
            />
            <motion.span
              className="font-sans text-body-sm-medium text-on-surface"
              animate={{ opacity: signalingDim ? 0.3 : 1 }}
            >
              WebRTC DataChannel · E2EE
            </motion.span>
            <motion.span
              className="h-px flex-1"
              animate={{
                backgroundColor: dataGlow ? 'rgba(56,189,248,0.7)' : 'rgba(44,49,61,1)',
                boxShadow: dataGlow ? '0 0 8px rgba(56,189,248,0.5)' : 'none',
              }}
            />
          </div>
        </div>

        <motion.div
          className="flex flex-col items-center gap-3"
          animate={{ opacity: peersDim ? 0.35 : 1 }}
        >
          <div className="flex h-11 w-28 items-center justify-center rounded-lg border border-surface-container-high bg-surface-container">
            <span className="text-on-surface">Peer B</span>
          </div>
          <span className="text-on-surface-variant">(browser)</span>
        </motion.div>
      </div>
    </div>
  )
}

export default TopologyDiagram