import { QrCode, X } from 'lucide-react'

interface QrModalProps {
  open: boolean
  onClose: () => void
  roomId: string
}

function QrModal({ open, onClose, roomId }: QrModalProps) {
  const inviteLink = `${window.location.origin}/?room=${roomId}`

  const copyLink = () => {
    void navigator.clipboard?.writeText(inviteLink)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-[420px] space-y-5 rounded-xl bg-surface-container-lowest p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary-fixed-dim" />
            <h3 className="font-sans text-headline-md font-medium text-on-surface">
              P2P Mesh Invite
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-outline transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary-container"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-low p-6">
          <svg className="h-44 w-44 text-on-surface" fill="currentColor" viewBox="0 0 100 100">
            <path d="M10 10h30v30h-30z M15 15v20h20v-20z M20 20h10v10h-10z M60 10h30v30h-30z M65 15v20h20v-20z M70 20h10v10h-10z M10 60h30v30h-30z M15 65v20h20v-20z M20 70h10v10h-10z M45 10h10v10h-10z M45 25h10v15h-10z M10 45h15v10h-15z M30 45h15v10h-15z M50 45h20v10h-20z M75 45h15v15h-15z M60 65h10v10h-10z M75 65h15v25h-15z M45 65h10v25h-10z M60 80h10v10h-10z" />
          </svg>
          <span className="mt-3 break-all px-2 text-center font-mono text-code-inline text-primary-fixed-dim">
            {inviteLink}
          </span>
        </div>

        <div className="space-y-2">
          <span className="font-sans text-caption uppercase tracking-wider text-outline">
            Fingerprint verification
          </span>
          <p className="break-all rounded-lg bg-surface-container-low p-2.5 font-mono text-code-inline text-on-surface-variant">
            SHA256:7F31:B820:99CA:012D:EF44:D91A:C401:AA78
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="h-9 flex-1 rounded-lg bg-surface-container-low font-sans text-body-sm-medium text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            Copy Invite Link
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg bg-on-surface px-4 font-sans text-body-sm-medium text-surface-container-lowest transition-colors hover:bg-inverse-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default QrModal
