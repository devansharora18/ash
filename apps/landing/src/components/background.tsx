import { useReducedMotion } from 'framer-motion'

import ShapeGrid from './shape_grid'

function Background() {
  const reduced = useReducedMotion()

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      {reduced ? (
        <div className="h-full w-full bg-surface-container-lowest" />
      ) : (
        <ShapeGrid
          direction="diagonal"
          speed={0.5}
          squareSize={44}
          borderColor="#38bdf8"
          hoverFillColor="#38bdf8"
          shape="square"
          hoverTrailAmount={6}
          className="opacity-40"
        />
      )}
    </div>
  )
}

export default Background