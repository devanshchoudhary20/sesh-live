import { useEffect, useState } from "react"
import { DEMO_SESSION_URL, RELAY_ORIGIN, STATS_POLL_MS } from "../config"
import { extractDemoRoomId } from "../lib/demoRoom"

// the pinned demo room's own viewer count is concurrent (open sockets); the aggregate is distinct tokens ever seen
const demoRoomId = extractDemoRoomId(DEMO_SESSION_URL)
const statsUrl = demoRoomId ? `${RELAY_ORIGIN}/r/${demoRoomId}/stats` : `${RELAY_ORIGIN}/stats`

// polling cadence mirrors apps/viewer's useRoomSocket stats poll (STATS_POLL_MS), same shape of problem
export function useLiveSession() {
  const [live, setLive] = useState(false)
  const [viewers, setViewers] = useState(0)

  useEffect(() => {
    let cancelled = false

    const poll = () => {
      fetch(statsUrl)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { live?: boolean; viewers?: number } | null) => {
          if (cancelled) return
          setLive(Boolean(data?.live))
          if (typeof data?.viewers === "number") setViewers(data.viewers)
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

  return { live, viewers }
}
