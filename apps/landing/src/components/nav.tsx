import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '../lib/cn'

const links = [
  { label: 'Problem', href: '#problem', id: 'problem' },
  { label: 'How it works', href: '#how', id: 'how' },
  { label: 'Security', href: '#security', id: 'security' },
  { label: 'Deploy', href: '#deploy', id: 'deploy' },
]

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const [progress, setProgress] = useState(0)

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setProgress(value)
    setScrolled(value > 0.02)
  })

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    for (const link of links) {
      const el = document.getElementById(link.id)
      if (!el) continue
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) setActive(link.id)
          }
        },
        { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
      )
      observer.observe(el)
      observers.push(observer)
    }
    return () => {
      for (const observer of observers) observer.disconnect()
    }
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300',
        scrolled
          ? 'border-surface-container-high bg-surface-container-lowest/70 backdrop-blur-xl'
          : 'border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <a
          href="#top"
          className="flex items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-container"
        >
          <span className="font-sans text-headline-md font-semibold lowercase tracking-tight text-on-surface">
            ash
          </span>
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-primary-container shadow-[0_0_8px] shadow-primary-container"
            animate={reduced ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={active === link.id ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-1.5 font-mono text-code-inline uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container',
                active === link.id
                  ? 'text-primary'
                  : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="https://github.com/devansharora18/ash"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-surface-container-high bg-surface-container px-3 py-1.5 font-sans text-body-sm-medium text-on-surface transition-colors hover:border-outline-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
        >
          <ShieldCheck className="h-4 w-4 text-primary-container" />
          Source
          <ArrowUpRight className="h-3.5 w-3.5 text-on-surface-variant" />
        </a>
      </nav>

      <motion.div
        aria-hidden="true"
        className="h-px bg-primary-container"
        style={{ scaleX: progress, transformOrigin: '0% 50%' }}
      />
    </header>
  )
}

export default Nav