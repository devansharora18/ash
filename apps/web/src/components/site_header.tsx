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
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-surface-container-high bg-surface-container-low px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-primary-container shadow-[0_0_6px] shadow-primary-container" />
            <span className="font-mono text-code-inline uppercase tracking-wider text-primary">
              E2EE ACTIVE
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
