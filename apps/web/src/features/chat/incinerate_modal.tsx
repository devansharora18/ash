import { Flame } from 'lucide-react'

interface IncinerateModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

function IncinerateModal({ open, onCancel, onConfirm }: IncinerateModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-[420px] space-y-4 rounded-xl bg-surface-container-lowest p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-error">
          <Flame className="h-[22px] w-[22px]" />
          <h3 className="font-sans text-headline-md font-semibold">
            Incinerate Session?
          </h3>
        </div>
        <p className="font-sans text-body-sm leading-relaxed text-on-surface-variant">
          This will immediately drop WebRTC connections, overwrite ephemeral
          cryptographic keys with pseudorandom zero-fill, and flush memory
          buffers. This action cannot be reversed.
        </p>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-lg bg-surface-container-low px-4 font-sans text-body-sm-medium text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 rounded-lg bg-error-container px-4 font-sans text-body-sm-medium text-on-error transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            Incinerate State
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncinerateModal
