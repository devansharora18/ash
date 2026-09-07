import Footer from './components/footer'
import Hero from './components/hero'
import Nav from './components/nav'
import SectionCta from './components/section_cta'
import Sections from './components/sections'
import TitleBand from './components/title_band'

function App() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-background font-sans text-on-surface">
      <Nav />
      <main>
        <Hero />
        <TitleBand />
        <Sections />
        <SectionCta />
      </main>
      <Footer />
    </div>
  )
}

export default App