function TitleBand() {
  return (
    <div className="border-b border-surface-container-high bg-surface-container-lowest">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-2 px-6 py-16 md:flex-row md:items-center md:justify-between">
        <p className="max-w-xl font-mono text-code-inline uppercase tracking-widest text-on-surface-variant">
          disposable · end-to-end encrypted · peer-to-peer
        </p>
        <p className="font-sans text-headline-md font-medium tracking-tight text-on-surface">
          The server gets peers connected — then gets out of the way.
        </p>
      </div>
    </div>
  )
}

export default TitleBand
