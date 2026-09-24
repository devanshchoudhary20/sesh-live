import { useEffect, useState } from "react"
import { RELAY_ORIGIN, STATS_POLL_MS } from "../config"

// polling cadence mirrors apps/viewer's useRoomSocket stats poll (STATS_POLL_MS), same shape of problem
export function useLiveSession() {
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false

    const poll = () => {
      fetch(`${RELAY_ORIGIN}/stats`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { live?: boolean } | null) => {
          if (!cancelled) setLive(Boolean(data?.live))
        })
        .catch(() => undefined)
    }

    poll()
    const interval = setInterval(poll, STATS_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return { live }
}
