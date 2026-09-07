import { ArrowRight } from 'lucide-react'

const claims = ['no accounts', 'no history', 'no logs', 'no central database']

function SectionCta() {
  return (
    <section className="border-b border-surface-container-high">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-6 py-28">
        <h2 className="max-w-2xl font-sans text-headline-lg font-semibold tracking-tight text-on-surface">
          Browsers own the conversation.
          <br />
          <span className="text-primary-container">Ash just introduces them.</span>
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://github.com/devansharora18/ash"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary-container px-5 font-sans text-body-sm-medium font-semibold text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            Explore the source
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {claims.map((claim) => (
            <li
              key={claim}
              className="flex items-center gap-2 font-mono text-code-inline text-on-surface-variant"
            >
              <span className="text-primary-container">→</span>
              {claim}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default SectionCta
