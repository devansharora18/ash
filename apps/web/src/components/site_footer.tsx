function SiteFooter() {
  return (
    <footer className="w-full border-t border-surface-container-high bg-surface-container-lowest py-6">
      <div className="flex w-full flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <span className="font-mono text-code-inline text-on-surface-variant">
            Zero-Knowledge Relay Mesh
          </span>
          <span className="text-outline-variant">•</span>
          <span className="font-mono text-code-inline text-on-surface-variant">
            Non-custodial ephemeral state
          </span>
        </div>
        <div className="font-mono text-code-inline text-on-surface-variant">
          © 2026 ASH PROTOCOL. ALL COMMUNICATIVE ARTIFACTS EPHEMERAL.
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
