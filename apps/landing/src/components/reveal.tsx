import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'

/**
 * Scroll reveal without a motion library: one shared IntersectionObserver flips
 * `data-visible` and index.css owns the transition (and the reduced-motion opt-out).
 */
const callbacks = new WeakMap<Element, () => void>()
let shared: IntersectionObserver | null = null

function revealObserver() {
  if (!shared) {
    shared = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          callbacks.get(entry.target)?.()
          callbacks.delete(entry.target)
          shared?.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -48px 0px', threshold: 0 },
    )
  }
  return shared
}

interface RevealProps {
  children: ReactNode
  /** milliseconds — use for staggering siblings */
  delay?: number
  /** travel distance in px */
  y?: number
  className?: string
}

function Reveal({ children, delay = 0, y = 18, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    callbacks.set(node, () => {
      node.dataset.visible = 'true'
    })
    const observer = revealObserver()
    observer.observe(node)
    return () => {
      callbacks.delete(node)
      observer.unobserve(node)
    }
  }, [])

  return (
    <div
      ref={ref}
      data-reveal=""
      className={className}
      style={
        {
          '--reveal-y': `${y}px`,
          '--reveal-delay': `${delay}ms`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}

export default Reveal
