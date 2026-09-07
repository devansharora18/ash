import { useState } from 'react'
import { Server, UserRound, X } from 'lucide-react'

interface SettingsModalProps {
  displayName: string
  backendUrl: string
  onSave: (displayName: string, backendUrl: string) => void
  onClose: () => void
}

function SettingsModal({
  displayName,
  backendUrl,
  onSave,
  onClose,
}: SettingsModalProps) {
  const [name, setName] = useState(displayName)
  const [url, setUrl] = useState(backendUrl)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    const trimmedName = name.trim()
    const trimmedUrl = url.trim().replace(/\/+$/, '')
    if (!trimmedName) {
      setError('Display name cannot be empty')
      return
    }
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setError('Backend URL must start with http:// or https://')
      return
    }
    onSave(trimmedName, trimmedUrl)
    onClose()
  }

  const labelCls =
    'font-sans text-caption font-medium uppercase tracking-wider text-outline'
  const inputCls =
    'h-10 w-full rounded-lg border bg-surface-container-lowest px-3.5 font-sans text-body-sm text-on-surface transition-colors placeholder:text-on-surface-variant/40 focus:outline-none border-surface-container-high focus:border-primary-container'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-[420px] space-y-5 rounded-xl bg-surface-container-lowest p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-primary-fixed-dim" />
            <h3 className="font-sans text-headline-md font-medium text-on-surface">
              Settings
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

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-name" className={labelCls}>
              Display Name
            </label>
            <input
              id="settings-name"
              autoComplete="off"
              spellCheck={false}
              maxLength={64}
              placeholder="e.g. cipher_wolf"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setError(null)
              }}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-url" className={labelCls}>
              Backend URL
            </label>
            <div className="relative">
              <Server className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="settings-url"
                autoComplete="off"
                spellCheck={false}
                placeholder="http://localhost:8000"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value)
                  setError(null)
                }}
                className={`${inputCls} pl-9 font-mono text-code-inline`}
              />
            </div>
          </div>

          {error && (
            <p className="font-sans text-caption text-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg bg-surface-container-low px-4 font-sans text-body-sm-medium text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-9 rounded-lg bg-on-surface px-4 font-sans text-body-sm-medium text-surface-container-lowest transition-colors hover:bg-inverse-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
