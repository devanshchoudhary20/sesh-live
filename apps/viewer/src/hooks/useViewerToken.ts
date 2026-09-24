import { useState } from "react"

const STORAGE_KEY = "sesh:viewer-token"

// Persists one token per browser so the relay can dedupe repeat visits into a single distinct viewer.
function readOrCreateToken(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const created = crypto.randomUUID()
    window.localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    return crypto.randomUUID()
  }
}

export function useViewerToken(): string {
  const [token] = useState(readOrCreateToken)
  return token
}
