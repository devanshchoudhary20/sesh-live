import { useState } from "react"
import { useTheme } from "./hooks/useTheme"
import { useSignupCount } from "./hooks/useSignupCount"
import "./App.css"

const FRIEND_SENTENCE =
  "Run npx sesh claude instead of claude, send me the link, and I can watch your session and grab the keyboard when it goes sideways. It never leaves your laptop."
const DEMO_VIDEO_URL = import.meta.env.VITE_DEMO_VIDEO_URL ?? ""
const DEMO_SESSION_URL = import.meta.env.VITE_DEMO_SESSION_URL ?? ""
const RELAY_URL = import.meta.env.VITE_RELAY_URL ?? ""
const GITHUB_URL = "https://github.com/anbu-dev/sesh"

type SubmitState = "idle" | "pending" | "success" | "error"

function counterCopy(count: number | null) {
  if (count === null) return "— signups so far"
  if (count === 0) return "Be the first to sign up"
  return `${count} signups so far`
}

async function submitSignup(email: string): Promise<number> {
  const res = await fetch(`${RELAY_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error("signup failed")
  const data = (await res.json()) as { count?: number }
  if (typeof data.count !== "number") throw new Error("malformed response")
  return data.count
}

function App() {
  const { theme, toggle } = useTheme()
  const { count, setCount } = useSignupCount()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<SubmitState>("idle")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email) return
    setStatus("pending")
    try {
      const nextCount = await submitSignup(email)
      setCount(nextCount)
      setStatus("success")
      setEmail("")
      setTimeout(() => setStatus("idle"), 3000)
    } catch {
      setStatus("error")
    }
  }

  const buttonLabel = status === "pending" ? "Sending…" : status === "success" ? "You're in" : "Get the link"

  return (
    <div className="page">
      <div className="top-row">
        <button type="button" className="theme-toggle" onClick={toggle}>
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>

      <h1 className="headline">{FRIEND_SENTENCE}</h1>

      <div className="recording-slot">
        {DEMO_VIDEO_URL ? (
          <video src={DEMO_VIDEO_URL} width={960} height={540} controls />
        ) : (
          <span>Recording coming soon</span>
        )}
      </div>

      <form className="signup-form" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button type="submit" disabled={status === "pending" || status === "success"}>
          {buttonLabel}
        </button>
      </form>
      {status === "error" && (
        <p className="error-text">Couldn't save that — check the address and try again.</p>
      )}

      <p className="counter">{counterCopy(count)}</p>

      <p className="live-link">
        {DEMO_SESSION_URL ? (
          <a href={DEMO_SESSION_URL}>watch a live session now</a>
        ) : (
          "No live session right now — check back during a posting window, or leave your email below."
        )}
      </p>

      <footer className="footer">
        <a href={GITHUB_URL}>GitHub</a>
      </footer>
    </div>
  )
}

export default App
