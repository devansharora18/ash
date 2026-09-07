import { motion } from 'framer-motion'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'

const links = [
  { label: 'Problem', href: '#problem' },
  { label: 'How it works', href: '#how' },
  { label: 'Security', href: '#security' },
  { label: 'Deploy', href: '#deploy' },
]

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-surface-container-high bg-surface-container-lowest/80 backdrop-blur-md">
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
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 font-sans text-body-sm-medium text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
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
    </header>
  )
}

export default Nav
