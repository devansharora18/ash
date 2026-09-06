import { useState } from 'react'
import { Check, Copy, Link, LogOut, QrCode } from 'lucide-react'

interface Peer {
  name: string
  tag: string
  mono?: boolean
  self?: boolean
}

const peers: Peer[] = [
  { name: 'You (Host)', tag: 'You', self: true },
  { name: 'cipher_wolf', tag: 'x25519' },
  { name: '0x8b32...d9a', tag: 'verified', mono: true },
]

const telemetry = [
  { label: 'Topology', value: 'WebRTC Mesh' },
  { label: 'Cipher', value: 'AES-GCM-256' },
  { label: 'Ratchet', value: 'Double Ratchet' },
]

const fingerprint = ['7F31', 'B820', '99CA', '012D', 'EF44', 'D91A', 'C401', 'AA78']

interface RoomSidebarProps {
  onInviteQr: () => void
  onLeaveRoom: () => void
}

function RoomSidebar({ onInviteQr, onLeaveRoom }: RoomSidebarProps) {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col bg-surface-container-lowest">
      <div className="bg-surface-container-lowest p-4">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-container" />
            </span>
            <h1 className="truncate font-sans text-headline-md font-semibold tracking-tight text-on-surface">
              #delta-protocol
            </h1>
          </div>
          <button
            type="button"
            title="Invite QR"
            onClick={onInviteQr}
            className="rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-container-low hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary-container"
          >
            <QrCode className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-1.5">
          <span className="font-mono text-code-inline uppercase tracking-wider text-on-surface-variant">
            Room Token
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-code-inline font-medium tracking-wider text-primary-fixed-dim">
              ash-8492
            </span>
            <button
              type="button"
              title="Copy Room ID"
              onClick={copyLink}
              className="text-outline transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary-container"
            >
              {copied ? (
                <Check className="h-[14px] w-[14px]" />
              ) : (
                <Copy className="h-[14px] w-[14px]" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        <div>
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="font-sans text-caption font-medium uppercase tracking-wider text-outline">
              Connected Peers
            </span>
            <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-mono text-code-inline text-primary-fixed-dim">
              3 online
            </span>
          </div>
          <div className="mt-1 space-y-1">
            {peers.map((peer) => (
              <div
                key={peer.name}
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-container-low ${
                  peer.self ? 'bg-surface-container-low/60' : ''
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-container" />
                  <span
                    className={`truncate text-on-surface ${
                      peer.mono
                        ? 'font-mono text-body-sm'
                        : 'font-sans text-body-sm-medium'
                    }`}
                  >
                    {peer.name}
                  </span>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 font-medium ${
                    peer.self
                      ? 'bg-surface-container-high font-mono text-[10px] uppercase tracking-wider text-on-surface-variant'
                      : 'font-mono text-code-inline text-outline'
                  }`}
                >
                  {peer.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 rounded-xl bg-surface-container-low p-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-caption font-medium uppercase tracking-wider text-outline">
              Network Mesh
            </span>
            <span className="font-mono text-code-inline text-primary-fixed-dim">
              P2P Full
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            {telemetry.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between font-mono text-code-inline"
              >
                <span className="text-on-surface-variant">{row.label}</span>
                <span className="text-on-surface">{row.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between font-mono text-code-inline">
              <span className="text-on-surface-variant">Latency</span>
              <span className="font-medium text-primary-fixed-dim">14ms</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-xl bg-surface-container-low p-3">
          <span className="block font-sans text-caption font-medium uppercase tracking-wider text-outline">
            Key Fingerprint
          </span>
          <div className="grid select-all grid-cols-4 gap-1 rounded-lg bg-surface-container-lowest p-2 text-center font-mono text-[11px] text-outline">
            {fingerprint.map((value) => (
              <span
                key={value}
                className={
                  value === 'D91A'
                    ? 'font-medium text-primary-fixed-dim'
                    : undefined
                }
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5 bg-surface-container-lowest p-3">
        <button
          type="button"
          onClick={copyLink}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-surface-container-low px-3 font-sans text-body-sm-medium text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary-container"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Link className="h-4 w-4" />
          )}
          <span>Copy Invite Link</span>
        </button>
        <button
          type="button"
          onClick={onLeaveRoom}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg px-3 font-sans text-body-sm-medium text-outline transition-colors hover:bg-error-container/20 hover:text-error focus-visible:outline-2 focus-visible:outline-primary-container"
        >
          <LogOut className="h-4 w-4" />
          <span>Leave Room</span>
        </button>
      </div>
    </aside>
  )
}

export default RoomSidebar
