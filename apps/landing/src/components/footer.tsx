import GithubIcon from './github_icon'
import { PROTOCOL_URL, REPO_URL } from '../lib/links'

const columns = [
  {
    heading: 'Protocol',
    links: [
      { label: 'Signaling reference', href: PROTOCOL_URL },
      { label: 'Architecture', href: `${REPO_URL}/tree/main/docs/architecture` },
      { label: 'Documentation', href: `${REPO_URL}/tree/main/docs` },
    ],
  },
  {
    heading: 'Code',
    links: [
      { label: 'Signaling server', href: `${REPO_URL}/tree/main/server` },
      { label: 'Web client', href: `${REPO_URL}/tree/main/apps/web` },
      { label: 'Deploy tool', href: `${REPO_URL}/tree/main/apps/desktop` },
    ],
  },
  {
    heading: 'Clients',
    links: [
      { label: 'Web', href: `${REPO_URL}/tree/main/apps/web` },
      { label: 'Mobile', href: `${REPO_URL}/tree/main/apps/mobile` },
      { label: 'Desktop', href: `${REPO_URL}/tree/main/apps/desktop` },
    ],
  },
]

function Footer() {
  return (
    <footer className="relative z-10 border-t border-hairline bg-background">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-4">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-headline-lg leading-none lowercase tracking-[-0.05em] text-on-surface">
                ash
              </span>
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary-container" />
            </div>
            <p className="mt-5 max-w-[36ch] font-sans text-body-sm text-on-surface-variant">
              Disposable, end-to-end encrypted peer-to-peer chat. A room exists only
              while someone is still in it.
            </p>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2.5 font-mono text-code-inline uppercase tracking-[0.14em] text-on-surface-variant transition-colors duration-300 hover:text-primary"
            >
              <GithubIcon className="h-4 w-4" />
              source · GPL-3.0
            </a>
          </div>

          <div className="grid gap-y-10 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
            {columns.map((column) => (
              <nav key={column.heading} aria-label={column.heading} className="flex flex-col">
                <p className="border-b border-hairline pb-2.5 font-mono text-code-inline uppercase tracking-[0.16em] text-on-surface-variant">
                  {column.heading}
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="link-wipe font-sans text-body-sm text-on-surface-variant transition-colors duration-300 hover:text-on-surface"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-code-inline uppercase tracking-[0.14em] text-on-surface-variant">
            © 2026 Ash Protocol · GPL-3.0
          </span>
          <span className="font-mono text-code-inline uppercase tracking-[0.14em] text-on-surface-variant">
            encrypted in your browser, forgotten on purpose
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
