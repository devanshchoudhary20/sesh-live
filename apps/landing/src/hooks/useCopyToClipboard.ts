import { useState } from "react"

const RESET_MS = 2000

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false)

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), RESET_MS)
    } catch {
      // clipboard API can be denied or unavailable (insecure context); the button just stays "Copy"
    }
  }

  return { copied, copy }
}
