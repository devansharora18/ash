import { motion } from 'framer-motion'
import { Container, Laptop, Wifi } from 'lucide-react'

import DeployTerminal from './deploy_terminal'
import { staggerContainer, staggerItem } from '../lib/anim'
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
      width="wide"
    >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="flex flex-col gap-4"
        >
          {targets.map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              variants={staggerItem}
              className="flex items-start gap-4 rounded-xl border border-surface-container-high bg-surface-container-lowest/70 p-5 backdrop-blur-sm"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-container-high bg-surface-container">
                <Icon className="h-4 w-4 text-primary-container" />
              </div>
              <div>
                <h3 className="font-sans text-headline-sm font-semibold tracking-tight text-on-surface">
                  {title}
                </h3>
                <p className="mt-1 font-sans text-body-sm leading-relaxed text-on-surface-variant">
                  {body}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={staggerItem}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <DeployTerminal />
        </motion.div>
      </div>
    </SectionShell>
  )
}

export default Deploy