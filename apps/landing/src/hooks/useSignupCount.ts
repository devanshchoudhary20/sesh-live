import { useEffect, useState } from "react"

const RELAY_URL = import.meta.env.VITE_RELAY_URL ?? ""

export function useSignupCount() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (!RELAY_URL) return
    fetch(`${RELAY_URL}/signup`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { count?: number } | null) => {
        if (typeof data?.count === "number") setCount(data.count)
      })
      .catch(() => undefined)
  }, [])

  return { count, setCount }
}
