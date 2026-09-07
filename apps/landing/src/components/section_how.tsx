import SectionShell from './section_shell'

const steps = [
  {
    title: 'Create a room',
    body: 'The signaling server issues an unpredictable room ID and holds only temporary connection state. No account, no profile.',
  },
  {
    title: 'Share a link',
    body: 'Peers open the invite link in a browser. The server introduces them by relaying WebRTC handshake data.',
  },
  {
    title: 'Talk directly',
    body: 'Once connected, messages travel browser-to-browser over a WebRTC DataChannel. The server is out of the message path.',
  },
  {
    title: 'Leave, and it vanishes',
    body: 'When the last peer leaves, in-memory room state is discarded. Nothing was ever written to disk.',
  },
]

function How() {
  return (
    <SectionShell
      id="how"
      eyebrow="How it works"
      title="A room, not a mailbox."
      lead="Ash uses a server for exactly one job: introducing peers. Once the direct connection exists, the server never touches your conversation again."
    >
      <ol className="grid gap-px overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-high md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3 bg-surface-container-lowest p-6">
            <span className="font-mono text-code-inline text-primary-container">
              0{index + 1}
            </span>
            <h3 className="font-sans text-headline-md font-medium tracking-tight text-on-surface">
              {step.title}
            </h3>
            <p className="font-sans text-body-sm leading-relaxed text-on-surface-variant">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </SectionShell>
  )
}

export default How
