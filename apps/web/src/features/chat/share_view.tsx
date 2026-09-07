import { useEffect, useRef, useState } from 'react'
import { MonitorUp, Volume2, VolumeX } from 'lucide-react'

export interface ShareSource {
  key: string
  label: string
  stream: MediaStream
  isSelf: boolean
}

function StreamVideo({ source }: { source: ShareSource }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    if (ref.current) ref.current.srcObject = source.stream
  }, [source.stream])

  return (
    <div className="relative overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-lowest">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted || source.isSelf}
        className="aspect-video w-full bg-black"
      />
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 text-on-surface backdrop-blur">
        <MonitorUp className="h-3.5 w-3.5" />
        <span className="font-sans text-caption font-medium">
          {source.label}{source.isSelf ? ' (you)' : ''}
        </span>
      </div>
      {!source.isSelf && (
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          title={muted ? 'Unmute' : 'Mute'}
          className="absolute right-3 top-3 rounded-md bg-black/50 p-1.5 text-on-surface backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-primary-container"
        >
          {muted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  )
}

function ShareView({ sources }: { sources: ShareSource[] }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto bg-surface-container-lowest p-4">
      {sources.map((source) => (
        <StreamVideo key={source.key} source={source} />
      ))}
    </div>
  )
}

export default ShareView