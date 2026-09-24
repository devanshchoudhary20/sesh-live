import { useEffect, useState } from "react"
import { RELAY_ORIGIN } from "../config"

export function useSignupCount() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(`${RELAY_ORIGIN}/signup/count`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { count?: number } | null) => {
        if (typeof data?.count === "number") setCount(data.count)
      })
      .catch(() => undefined)
  }, [])

  return { count, setCount }
}
