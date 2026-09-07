import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  hue: number
}

const CYAN = [56, 189, 248] as const
const VIOLET = [139, 92, 246] as const
const SLATE = [148, 163, 184] as const

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let raf = 0
    let nodes: Node[] = []
    let scrollY = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const build = () => {
      const isMobile = w < 768
      const count = isMobile ? 20 : 48
      nodes = Array.from({ length: count }, (_, i) => ({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-0.12, 0.12),
        vy: rand(-0.12, 0.12),
        size: rand(0.8, 1.8),
        hue: i % 6 === 0 ? 1 : i % 9 === 0 ? 2 : 0,
      }))
    }

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      build()
    }

    const dist = () => Math.min(w, h) * 0.22

    const step = () => {
      ctx.clearRect(0, 0, w, h)

      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < -10) n.x = w + 10
        if (n.x > w + 10) n.x = -10
        if (n.y < -10) n.y = h + 10
        if (n.y > h + 10) n.y = -10
      }

      const max = dist()
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.hypot(dx, dy)
          if (d > max) continue
          const t = 1 - d / max
          const alpha = t * 0.07
          const rgb = a.hue === 1 || b.hue === 1 ? VIOLET : a.hue === 2 || b.hue === 2 ? SLATE : CYAN
          ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      for (const n of nodes) {
        const rgb = n.hue === 1 ? VIOLET : n.hue === 2 ? SLATE : CYAN
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.35)`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const loop = () => {
      step()
      raf = requestAnimationFrame(loop)
    }

    const onScroll = () => {
      scrollY = window.scrollY
    }

    let lastTranslate = 0
    const parallax = () => {
      const t = -scrollY * 0.08
      if (Math.abs(t - lastTranslate) > 0.5) {
        wrap.style.transform = `translateY(${t}px)`
        lastTranslate = t
      }
      raf = requestAnimationFrame(parallax)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })

    if (reduced) {
      step()
    } else {
      raf = requestAnimationFrame(loop)
      raf = requestAnimationFrame(parallax)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-40 will-change-transform"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}

export default MeshBackground