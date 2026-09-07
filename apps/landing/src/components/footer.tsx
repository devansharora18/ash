import GithubIcon from './github_icon'

const columns = [
  {
    heading: 'Protocol',
    links: [
      { label: 'Signaling reference', href: 'https://github.com/devansharora18/ash/blob/main/docs/protocol.md' },
      { label: 'Architecture', href: 'https://github.com/devansharora18/ash/tree/main/docs/architecture' },
      { label: 'Documentation', href: 'https://github.com/devansharora18/ash/tree/main/docs' },
    ],
  },
  {
    heading: 'Code',
    links: [
      { label: 'Signaling server', href: 'https://github.com/devansharora18/ash/tree/main/server' },
      { label: 'Web client', href: 'https://github.com/devansharora18/ash/tree/main/apps/web' },
      { label: 'Deploy tool', href: 'https://github.com/devansharora18/ash/tree/main/apps/desktop' },
    ],
  },
]

function Footer() {
  return (
    <footer className="bg-surface-container-lowest">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="flex flex-col gap-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="font-sans text-headline-md font-semibold lowercase tracking-tight text-on-surface">
                ash
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary-container shadow-[0_0_8px] shadow-primary-container" />
            </div>
            <p className="max-w-sm font-sans text-body-sm leading-relaxed text-on-surface-variant">
              Disposable, self-hostable, end-to-end encrypted peer-to-peer chat.
              The server introduces peers and then gets out of the way.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} className="flex flex-col gap-3" aria-label={column.heading}>
              <p className="font-mono text-code-inline uppercase tracking-widest text-on-surface-variant">
                {column.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-sans text-body-sm text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-surface-container-high pt-6 sm:flex-row sm:items-center">
          <span className="font-mono text-code-inline text-on-surface-variant">
            © 2026 Ash Protocol · GPL-3.0
          </span>
          <a
            href="https://github.com/devansharora18/ash"
            target="_blank"
            rel="noreferrer"
            aria-label="Ash on GitHub"
            className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            <GithubIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
