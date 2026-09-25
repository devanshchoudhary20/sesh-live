import { useState } from "react"
import { isValidEmail } from "../lib/email"
import { formatSignupCount } from "../lib/format"
import { RELAY_ORIGIN } from "../config"

type SubmitState = "idle" | "pending" | "success" | "error"

const SUCCESS_RESET_MS = 3000

interface SignupFormProps {
  count: number | null
  onSuccess: (count: number) => void
}

async function submitSignup(email: string): Promise<number> {
  const res = await fetch(`${RELAY_ORIGIN}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error("signup failed")
  const data = (await res.json()) as { count?: number }
  if (typeof data.count !== "number") throw new Error("malformed response")
  return data.count
}

export function SignupForm({ count, onSuccess }: SignupFormProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<SubmitState>("idle")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = email.trim()
    if (!isValidEmail(trimmed)) return

    setStatus("pending")
    try {
      const nextCount = await submitSignup(trimmed)
      onSuccess(nextCount)
      setStatus("success")
      setEmail("")
      setTimeout(() => setStatus("idle"), SUCCESS_RESET_MS)
    } catch {
      setStatus("error")
    }
  }

  const buttonLabel = status === "pending" ? "Sending…" : status === "success" ? "You're in" : "Notify me"
  const buttonDisabled = status === "pending" || status === "success"

  return (
    <div className="signup">
      <form className="signup-form" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button type="submit" disabled={buttonDisabled}>
          {buttonLabel}
        </button>
      </form>
      {status === "error" && (
        <p className="error-text">Couldn't save that — check the address and try again.</p>
      )}
      <p className="counter">{formatSignupCount(count)}</p>
    </div>
  )
}
