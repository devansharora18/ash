import Footer from './components/footer'
import Grain from './components/grain'
import Hero from './components/hero'
import MeshBackground from './components/mesh_background'
import Nav from './components/nav'
import SectionCta from './components/section_cta'
import Sections from './components/sections'
import TitleBand from './components/title_band'

function App() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans text-on-surface">
      <MeshBackground />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <TitleBand />
        <Sections />
        <SectionCta />
      </main>
      <Footer />
      <Grain />
    </div>
  )
}

export default App