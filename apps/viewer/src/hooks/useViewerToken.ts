import { useState } from "react"

const STORAGE_KEY = "sesh:viewer-token"

// sessionStorage (not localStorage) so each tab gets its own token and counts as its own live viewer.
function readOrCreateToken(): string {
  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const created = crypto.randomUUID()
    window.sessionStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    return crypto.randomUUID()
  }
}

export function useViewerToken(): string {
  const [token] = useState(readOrCreateToken)
  return token
}
