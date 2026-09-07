import { Container, Laptop, Server, Wifi } from 'lucide-react'

import SectionShell from './section_shell'

const targets = [
  {
    icon: Laptop,
    title: 'Self-hosted',
    body: 'A small FastAPI signaling server runs on a laptop or VPS. Room state lives in memory only.',
  },
  {
    icon: Container,
    title: 'One-command deploy',
    body: 'A Docker image with a health check. Bring it up with docker compose and you are live.',
  },
  {
    icon: Wifi,
    title: 'Public without port-forwarding',
    body: 'An outbound Cloudflare Tunnel exposes the server behind NAT with no inbound firewall rule.',
  },
]

function Deploy() {
  return (
    <SectionShell
      id="deploy"
      eyebrow="Self-host"
      title="Infrastructure you control."
      lead="No managed backend required. The entire coordination layer is a boring, single-process server you can run anywhere and tear down on a whim."
    >
      <div className="grid gap-px overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-high md:grid-cols-3">
        {targets.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col gap-4 bg-surface-container-lowest p-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-container-high bg-surface-container">
              <Icon className="h-4 w-4 text-primary-container" />
            </div>
            <h3 className="font-sans text-headline-md font-medium tracking-tight text-on-surface">
              {title}
            </h3>
            <p className="font-sans text-body-sm leading-relaxed text-on-surface-variant">
              {body}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest">
        <div className="flex items-center justify-between border-b border-surface-container-high px-5 py-3">
          <span className="font-sans text-body-sm-medium text-on-surface">signaling server</span>
          <Server className="h-4 w-4 text-on-surface-variant" />
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-code-inline leading-relaxed text-on-surface-variant">
{`$ docker compose up -d
$ curl http://localhost:8000/health
{"status":"ok"}`}
        </pre>
      </div>
    </SectionShell>
  )
}

export default Deploy
