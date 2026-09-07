import SectionShell from './section_shell'

function ArchitectureDiagram() {
  return (
    <div className="overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-surface-container-high px-5 py-3">
        <span className="font-mono text-code-inline uppercase tracking-widest text-on-surface-variant">
          topology
        </span>
        <span className="font-mono text-code-inline text-primary-container">
          full mesh
        </span>
      </div>

      <div className="flex flex-col gap-6 p-6 font-mono text-code-inline sm:flex-row sm:items-stretch sm:justify-between">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-11 w-28 items-center justify-center rounded-lg border border-primary-container/40 bg-surface-container">
            <span className="text-on-surface">Peer A</span>
          </div>
          <span className="text-on-surface-variant">(browser)</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2">
          <div className="flex w-full items-center justify-center gap-2 text-on-surface-variant">
            <span className="h-px flex-1 bg-outline-variant" />
            <span className="rounded border border-surface-container-high bg-surface-container px-2 py-1 text-on-surface-variant">
              signaling (intro only)
            </span>
            <span className="h-px flex-1 bg-outline-variant" />
          </div>
          <span className="rounded border border-surface-container-high bg-surface-container px-2 py-1 text-on-surface-variant">
            SDP · ICE
          </span>
          <div className="flex w-full items-center gap-2 text-primary-container">
            <span className="h-px flex-1 bg-primary-container/50" />
            <span className="font-sans text-body-sm-medium text-on-surface">
              WebRTC DataChannel · E2EE
            </span>
            <span className="h-px flex-1 bg-primary-container/50" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex h-11 w-28 items-center justify-center rounded-lg border border-primary-container/40 bg-surface-container">
            <span className="text-on-surface">Peer B</span>
          </div>
          <span className="text-on-surface-variant">(browser)</span>
        </div>
      </div>
    </div>
  )
}

const facts = [
  {
    label: 'What the server sees',
    value: 'only connection metadata — room IDs, who joined, when. Never plaintext.',
  },
  {
    label: 'What the server stores',
    value: 'volatile in-memory state. Nothing written to disk, logs carry no message content.',
  },
  {
    label: 'Where encryption happens',
    value: 'in the browser, before a byte leaves the device.',
  },
]

function Security() {
  return (
    <SectionShell
      id="security"
      eyebrow="Security model"
      title="The matchmaker never reads the mail."
      lead="Peers agree on keys and encrypt locally with libsodium — X25519 key exchange and XSalsa20-Poly1305 authenticated encryption. The signaling path handles only handshake data."
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ArchitectureDiagram />
          <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-high sm:grid-cols-3">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-surface-container-lowest p-4">
                <p className="font-mono text-code-inline uppercase tracking-wider text-primary-container">
                  {fact.label}
                </p>
                <p className="mt-1.5 font-sans text-caption leading-relaxed text-on-surface-variant">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-6">
            <p className="font-mono text-code-inline uppercase tracking-widest text-on-surface-variant">
              message path
            </p>
            <ol className="mt-4 flex flex-col gap-3 font-mono text-code-inline">
              <li className="flex items-center gap-3">
                <span className="text-on-surface">plaintext</span>
                <span className="flex-1 border-t border-dashed border-outline-variant" />
                <span className="text-on-surface-variant">client</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-primary-container">encrypt</span>
                <span className="flex-1 border-t border-dashed border-outline-variant" />
                <span className="text-on-surface-variant">libsodium</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-on-surface-variant">ciphertext</span>
                <span className="flex-1 border-t border-dashed border-outline-variant" />
                <span className="text-on-surface-variant">DataChannel</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-primary-container">decrypt</span>
                <span className="flex-1 border-t border-dashed border-outline-variant" />
                <span className="text-on-surface-variant">receiving peer</span>
              </li>
            </ol>
          </div>

          <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-6">
            <p className="font-mono text-code-inline uppercase tracking-widest text-on-surface-variant">
              honest limits
            </p>
            <ul className="mt-3 flex flex-col gap-2 font-sans text-caption leading-relaxed text-on-surface-variant">
              <li>Ash is privacy-oriented, not an anonymity network.</li>
              <li>A recipient can always copy or screenshot what they see.</li>
              <li>E2EE protects content, not connection metadata.</li>
            </ul>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

export default Security
