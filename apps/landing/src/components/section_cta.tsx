import Arrow from './arrow'
import Reveal from './reveal'
import { APP_URL, REPO_URL } from '../lib/links'

/**
 * The closer. The page has been paper the whole way down; here it burns through
 * to carbon (a torn top edge, inverted surface) for the single action.
 */
function SectionCta() {
  return (
    <section className="torn-top bg-band text-on-band">
      <div className="mx-auto w-full max-w-[1240px] px-5 pb-24 pt-32 sm:px-8 sm:pb-28 sm:pt-36 lg:pt-40">
        <Reveal>
          <p className="font-mono text-code-inline uppercase tracking-[0.2em] text-band-accent">
            the invitation
          </p>
        </Reveal>

        <Reveal delay={90}>
          <h2 className="mt-8 max-w-[16ch] font-display text-display-lg font-semibold text-balance">
            There is nothing left to leak.
          </h2>
        </Reveal>

        <Reveal delay={180}>
          <p className="mt-8 max-w-[48ch] font-sans text-body-base text-on-band/75">
            Make a room, send one link, say what you actually need to say. When you
            close the tab the room is gone — and there was never a copy to lose.
          </p>
        </Reveal>

        <Reveal delay={260} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <a
            href={APP_URL}
            className="group inline-flex h-12 items-center gap-2.5 rounded-sm bg-band-accent px-6 font-sans text-body-sm-medium text-band transition-colors duration-300 hover:bg-on-band hover:text-band active:translate-y-px"
          >
            Start a room
            <Arrow />
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="link-wipe font-mono text-code-inline uppercase tracking-[0.14em] text-on-band/80 transition-colors duration-300 hover:text-on-band"
          >
            read the source
          </a>
        </Reveal>

        <Reveal delay={340} className="mt-16 border-t border-on-band/20 pt-5">
          <p className="font-mono text-code-inline uppercase tracking-[0.14em] text-on-band/60">
            no account · no install · nothing to hand over
          </p>
        </Reveal>
      </div>
    </section>
  )
}

export default SectionCta
