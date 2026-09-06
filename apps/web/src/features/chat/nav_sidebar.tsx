import { Flame, KeyRound, Lock, Network, Terminal } from 'lucide-react'

function NavSidebar() {
  const baseLink =
    'flex items-center justify-between rounded px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary-container'
  const baseIcon = 'flex items-center gap-2.5'

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-surface-container-high bg-surface-container-lowest">
      <div className="flex h-12 items-center justify-between border-b border-surface-container-high px-4">
        <div className="flex items-center gap-1.5">
          <span className="font-sans text-headline-md font-semibold tracking-tight lowercase text-on-surface">
            ash
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary-container shadow-[0_0_8px] shadow-primary-container" />
        </div>
        <span className="rounded border border-surface-container-high bg-surface-container-low px-2 py-0.5 font-mono text-code-inline text-on-surface-variant">
          v0.9
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="px-2 pb-2 font-sans text-caption uppercase tracking-wider text-outline">
          Active Channels
        </div>
        <a
          href="#"
          aria-current="page"
          className={`${baseLink} bg-surface-container-high text-on-surface`}
        >
          <span className={baseIcon}>
            <Lock className="h-[18px] w-[18px]" />
            <span className="font-sans text-body-sm-medium">Active Room</span>
          </span>
          <span className="h-2 w-2 rounded-full bg-primary-container" />
        </a>
        <a
          href="#"
          className={`${baseLink} text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface`}
        >
          <span className={baseIcon}>
            <Network className="h-[18px] w-[18px]" />
            <span className="font-sans text-body-sm-medium">Mesh Peers</span>
          </span>
          <span className="font-mono text-code-inline text-on-surface-variant">3/3</span>
        </a>
        <a
          href="#"
          className={`${baseLink} text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface`}
        >
          <span className={baseIcon}>
            <Terminal className="h-[18px] w-[18px]" />
            <span className="font-sans text-body-sm-medium">Ephemeral Audit</span>
          </span>
        </a>

        <div className="px-2 pb-2 pt-4 font-sans text-caption uppercase tracking-wider text-outline">
          Session Controls
        </div>
        <a
          href="#"
          className={`${baseLink} text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface`}
        >
          <span className={baseIcon}>
            <KeyRound className="h-[18px] w-[18px]" />
            <span className="font-sans text-body-sm-medium">Key Fingerprints</span>
          </span>
        </a>
        <a
          href="#"
          className={`${baseLink} text-error hover:bg-surface-container-low`}
        >
          <span className={baseIcon}>
            <Flame className="h-[18px] w-[18px] text-error" />
            <span className="font-sans text-body-sm-medium">Incinerate State</span>
          </span>
        </a>
      </nav>

      <div className="border-t border-surface-container-high bg-surface-container-lowest p-3">
        <div className="flex items-center justify-between rounded border border-surface-container-high bg-surface-container-low px-2 py-1.5">
          <span className="font-mono text-code-inline text-on-surface-variant">
            FINGERPRINT
          </span>
          <span className="font-mono text-code-inline text-primary-fixed-dim">
            0x4F92...B1A4
          </span>
        </div>
      </div>
    </aside>
  )
}

export default NavSidebar
