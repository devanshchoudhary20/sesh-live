import { useTheme } from "./hooks/useTheme"
import { useSignupCount } from "./hooks/useSignupCount"
import { Hero } from "./components/Hero"
import { SignupForm } from "./components/SignupForm"
import { LiveSessionLink } from "./components/LiveSessionLink"
import { Footer } from "./components/Footer"
import "./App.css"

function App() {
  const { theme, toggle } = useTheme()
  const { count, setCount } = useSignupCount()

  return (
    <div className="page">
      <div className="top-row">
        <button type="button" className="theme-toggle" onClick={toggle}>
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>

      <main>
        <Hero />
        <SignupForm count={count} onSuccess={setCount} />
        <LiveSessionLink />
      </main>
      <Footer />
    </div>
  )
}

export default App
