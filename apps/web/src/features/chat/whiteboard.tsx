import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser, PenLine, Users } from 'lucide-react'

export interface BoardStroke {
  id: string
  color: string
  width: number
  points: { x: number; y: number }[]
}

const PALETTE = [
  '#00d9ff',
  '#ffffff',
  '#000000',
  '#22c55e',
  '#eab308',
  '#ef4444',
  '#a855f7',
]
const WIDTHS = [2, 5, 10]

interface WhiteboardProps {
  strokes: BoardStroke[]
  onStrokeStart: (x: number, y: number, color: string, width: number) => void
  onStrokePoint: (x: number, y: number) => void
  onStrokeEnd: () => void
  onClear: () => void
}

function Whiteboard({
  strokes,
  onStrokeStart,
  onStrokePoint,
  onStrokeEnd,
  onClear,
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [color, setColor] = useState(PALETTE[0])
  const [width, setWidth] = useState(WIDTHS[0])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const sx = canvas.width / Math.max(1, canvas.clientWidth)
    const sy = canvas.height / Math.max(1, canvas.clientHeight)
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width * ((sx + sy) / 2)
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height)
      }
      ctx.stroke()
    }
  }, [strokes])

  useEffect(() => {
    redraw()
  }, [redraw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      if (
        Math.abs(canvas.width - w * dpr) > 1 ||
        Math.abs(canvas.height - h * dpr) > 1
      ) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      redraw()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [redraw])

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(event)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drawingRef.current = true
    onStrokeStart(point.x, point.y, color, width)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const point = pointFromEvent(event)
    if (!point) return
    onStrokePoint(point.x, point.y)
  }

  const handlePointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    onStrokeEnd()
  }

  const toolBtn = (active: boolean) =>
    `flex h-7 w-7 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-primary-container ${
      active ? 'bg-surface-container-high text-on-surface' : 'text-outline hover:bg-surface-container-high hover:text-on-surface'
    }`

  return (
    <div className="relative min-w-0 flex-1 overflow-hidden bg-surface-container-lowest">
      <div className="pointer-events-none absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-surface-container/90 px-2 py-1 shadow-sm backdrop-blur">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Draw color ${c}`}
            onClick={() => setColor(c)}
            className={`h-5 w-5 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-primary-container ${
              color === c ? 'ring-2 ring-on-surface' : ''
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <span className="mx-1 h-5 w-px bg-surface-container-high" />
        {WIDTHS.map((w) => (
          <button
            key={w}
            type="button"
            aria-label={`Stroke width ${w}`}
            onClick={() => setWidth(w)}
            className={toolBtn(width === w)}
          >
            <span
              className="rounded-full bg-current"
              style={{ width: w, height: w }}
            />
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-surface-container-high" />
        <button
          type="button"
          aria-label="Clear whiteboard"
          onClick={onClear}
          className={toolBtn(false)}
        >
          <Eraser className="h-4 w-4" />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="h-full w-full cursor-crosshair touch-none"
      />

      <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-1.5 text-on-surface-variant/70">
        <Users className="h-3.5 w-3.5" />
        <PenLine className="h-3.5 w-3.5" />
        <span className="font-mono text-code-inline">live board</span>
      </div>
    </div>
  )
}

export default Whiteboard