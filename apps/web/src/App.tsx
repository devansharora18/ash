import SiteFooter from './components/site_footer'
import SiteHeader from './components/site_header'
import HomePage from './features/home/home_page'

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="w-full flex-1 pt-12">
        <HomePage />
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
