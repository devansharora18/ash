import { useEffect, useRef, useState } from 'react'

import GithubIcon from './github_icon'
import { cn } from '../lib/cn'
import { APP_URL, REPO_URL } from '../lib/links'

const links = [
  { label: 'Why', href: '#problem', id: 'problem' },
  { label: 'How it works', href: '#how', id: 'how' },
  { label: 'Security', href: '#security', id: 'security' },
  { label: 'Self-host', href: '#deploy', id: 'deploy' },
]

function Nav() {
  const [active, setActive] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const bar = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const doc = document.documentElement
      const span = doc.scrollHeight - window.innerHeight
      const ratio = span > 0 ? window.scrollY / span : 0
      if (bar.current) bar.current.style.transform = `scaleX(${ratio.toFixed(4)})`
      setScrolled(window.scrollY > 8)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const observed: IntersectionObserver[] = []
    for (const link of links) {
      const node = document.getElementById(link.id)
      if (!node) continue
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) setActive(link.id)
          }
        },
        { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
      )
      observer.observe(node)
      observed.push(observer)
    }
    return () => {
      for (const observer of observed) observer.disconnect()
    }
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500',
        scrolled
          ? 'border-hairline bg-background/82 backdrop-blur-md'
          : 'border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-14 w-full max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8">
        <a href="#top" className="group flex items-baseline gap-2">
          <span className="font-display text-headline-sm leading-none lowercase tracking-[-0.05em] text-on-surface">
            ash
          </span>
          <span aria-hidden="true" className="live-dot h-1.5 w-1.5 rounded-full bg-primary-container" />
          <span className="sr-only">Ash, home</span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              data-active={active === link.id}
              aria-current={active === link.id ? 'true' : undefined}
              className={cn(
                'link-wipe font-mono text-code-inline uppercase tracking-[0.16em]',
                active === link.id ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Ash source on GitHub"
            className="hidden text-on-surface-variant transition-colors duration-300 hover:text-primary sm:block"
          >
            <GithubIcon className="h-[18px] w-[18px]" />
          </a>
          <a
            href={APP_URL}
            className="inline-flex h-9 items-center rounded-sm bg-primary-container px-3.5 font-sans text-body-sm-medium text-on-primary transition-colors duration-300 hover:bg-on-surface hover:text-background active:translate-y-px"
          >
            Start a room
          </a>
        </div>
      </nav>

      <span
        ref={bar}
        aria-hidden="true"
        className="block h-px origin-left scale-x-0 bg-primary-container"
      />
    </header>
  )
}

export default Nav
