import { User } from 'lucide-react'

const navItems = [
  { label: 'Overview', active: true },
  { label: 'Protocol', active: false },
  { label: 'Security Spec', active: false },
]

function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-surface-container-high bg-surface-container-lowest/90 backdrop-blur-md">
      <div className="flex h-12 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-headline-md font-semibold tracking-tight lowercase text-on-surface">
              ash
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary-container shadow-[0_0_8px] shadow-primary-container" />
          </div>
          <span className="rounded border border-surface-container-high bg-surface-container-low px-2 py-0.5 font-mono text-code-inline text-on-surface-variant">
            p2p v0.9
          </span>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href="#"
                aria-current={item.active ? 'page' : undefined}
                className={`rounded px-3 py-1 font-sans text-body-sm-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container ${
                  item.active
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-surface-container-high bg-surface-container-low px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-primary-container shadow-[0_0_6px] shadow-primary-container" />
            <span className="font-mono text-code-inline uppercase tracking-wider text-primary">
              E2EE ACTIVE
            </span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <User className="h-[18px] w-[18px] text-on-primary" />
          </div>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
