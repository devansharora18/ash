import { useState } from 'react'
import { Check, Copy, Link, LogOut, QrCode } from 'lucide-react'

const telemetry = [
  { label: 'Topology', value: 'Star relay' },
  { label: 'Cipher', value: '—' },
  { label: 'Ratchet', value: '—' },
]

const fingerprint = ['—', '—', '—', '—', '—', '—', '—', '—']

interface RoomSidebarProps {
  roomId: string
  displayName: string
  peers: string[]
  onInviteQr: () => void
  onLeaveRoom: () => void
}

function RoomSidebar({
  roomId,
  displayName,
  peers,
  onInviteQr,
  onLeaveRoom,
}: RoomSidebarProps) {
  const [copied, setCopied] = useState(false)

  const inviteLink = `${window.location.origin}/?room=${roomId}`

  const copyLink = () => {
    void navigator.clipboard?.writeText(inviteLink)
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
              #{roomId.slice(0, 8)}
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
            Room ID
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-code-inline font-medium tracking-wider text-primary-fixed-dim">
              {roomId}
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
              {peers.length} online
            </span>
          </div>
          <div className="mt-1 space-y-1">
            <div className="flex items-center justify-between rounded-lg bg-surface-container-low/60 px-2.5 py-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-container" />
                <span className="truncate font-sans text-body-sm-medium text-on-surface">
                  {displayName} (You)
                </span>
              </div>
              <span className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                host
              </span>
            </div>
            {peers.map((peerId) => (
              <div
                key={peerId}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-container-low"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-container" />
                  <span className="truncate font-sans text-body-sm-medium text-on-surface">
                    {peerId}
                  </span>
                </div>
                <span className="font-mono text-code-inline text-outline">
                  peer
                </span>
              </div>
            ))}
            {peers.length === 0 && (
              <p className="px-2.5 py-1 font-sans text-caption text-outline">
                Waiting for a peer to join…
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2.5 rounded-xl bg-surface-container-low p-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-caption font-medium uppercase tracking-wider text-outline">
              Transport
            </span>
            <span className="font-mono text-code-inline text-primary-fixed-dim">
              Signaling relay
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
          </div>
        </div>

        <div className="space-y-2 rounded-xl bg-surface-container-low p-3">
          <span className="block font-sans text-caption font-medium uppercase tracking-wider text-outline">
            Key Fingerprint
          </span>
          <div className="grid select-all grid-cols-4 gap-1 rounded-lg bg-surface-container-lowest p-2 text-center font-mono text-[11px] text-outline">
            {fingerprint.map((value) => (
              <span key={value}>{value}</span>
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
