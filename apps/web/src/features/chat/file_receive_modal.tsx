import { Download, X } from 'lucide-react'

import type { FileOffer } from '../../lib/rtc'

interface FileReceiveModalProps {
  from: string
  offer: FileOffer
  onAccept: () => void
  onDecline: () => void
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

function FileReceiveModal({ from, offer, onAccept, onDecline }: FileReceiveModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-[420px] space-y-5 rounded-xl bg-surface-container-lowest p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary-fixed-dim" />
            <h3 className="font-sans text-headline-md font-medium text-on-surface">
              Incoming file
            </h3>
          </div>
          <button
            type="button"
            onClick={onDecline}
            className="p-1 text-outline transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary-container"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          <span className="block truncate font-sans text-headline-md font-medium text-on-surface">
            {offer.name}
          </span>
          <div className="flex items-center gap-2 font-mono text-code-inline text-on-surface-variant">
            <span>{offer.mime || 'unknown type'}</span>
            <span>•</span>
            <span>{formatSize(offer.size)}</span>
            <span>•</span>
            <span>from {from}</span>
          </div>
          <p className="pt-1 font-sans text-body-sm text-on-surface-variant">
            Accepting will download this file peer-to-peer over your direct
            connection.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onDecline}
            className="h-9 rounded-lg bg-surface-container-low px-4 font-sans text-body-sm-medium text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary-container"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="h-9 rounded-lg bg-on-surface px-4 font-sans text-body-sm-medium text-surface-container-lowest transition-colors hover:bg-inverse-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            Accept & Download
          </button>
        </div>
      </div>
    </div>
  )
}

export default FileReceiveModal