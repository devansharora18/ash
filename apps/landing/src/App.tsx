import Atmosphere from './components/atmosphere'
import Footer from './components/footer'
import Hero from './components/hero'
import Nav from './components/nav'
import SectionCta from './components/section_cta'
import Sections from './components/sections'

function App() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans text-on-surface">
      <Atmosphere />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <Sections />
        <SectionCta />
      </main>
      <Footer />
    </div>
  )
}

export default App
