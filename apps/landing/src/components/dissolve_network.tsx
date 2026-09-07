import { useEffect, useRef } from 'react'

interface DNode {
  x: number
  y: number
  size: number
  born: number
  life: number
  hue: number
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function DissolveNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let raf = 0
    let nodes: DNode[] = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      w = parent.clientWidth
      h = parent.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = (time: number) => {
      while (nodes.length < 60) {
        nodes.push({
          x: rand(0, w),
          y: rand(0, h),
          size: rand(1, 2.2),
          born: time,
          life: rand(4000, 8000),
          hue: Math.random() < 0.15 ? 1 : Math.random() < 0.2 ? 2 : 0,
        })
      }
    }

    const step = (time: number) => {
      ctx.clearRect(0, 0, w, h)
      spawn(time)
      const dist = Math.min(w, h) * 0.16

      // prune dead
      nodes = nodes.filter((n) => time - n.born < n.life)
      const alive = nodes

      for (let i = 0; i < alive.length; i++) {
        for (let j = i + 1; j < alive.length; j++) {
          const a = alive[i]
          const b = alive[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.hypot(dx, dy)
          if (d > dist) continue
          const t = 1 - d / dist
          const alpha = t * 0.1
          const rgb =
            a.hue === 1 || b.hue === 1 ? [139, 92, 246] : a.hue === 2 || b.hue === 2 ? [148, 163, 184] : [56, 189, 248]
          ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      for (const n of alive) {
        const fade = Math.min(1, (time - n.born) / 600) * Math.min(1, (n.life - (time - n.born)) / 600)
        const rgb = n.hue === 1 ? [139, 92, 246] : n.hue === 2 ? [148, 163, 184] : [56, 189, 248]
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.5 * fade})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const loop = (time: number) => {
      step(time)
      raf = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    if (reduced) {
      step(performance.now())
    } else {
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}

export default DissolveNetwork