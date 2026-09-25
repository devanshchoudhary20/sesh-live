import { useLiveSession } from "../hooks/useLiveSession"
import { DEMO_SESSION_URL } from "../config"

const NO_LIVE_SESSION_COPY = "No live session right now, leave your email to get the link"

function livePillCopy(live: boolean, viewers: number): string {
  return live ? `Live now, ${viewers} watching` : NO_LIVE_SESSION_COPY
}

// Polls via useLiveSession (STATS_POLL_MS = 10s); a link only when there's somewhere to send the click.
export function LiveSessionLink() {
  const { live, viewers } = useLiveSession()
  const showLink = live && Boolean(DEMO_SESSION_URL)
  const label = livePillCopy(live, viewers)

  return showLink ? (
    <a className="live-pill live-pill-active" href={DEMO_SESSION_URL}>{label}</a>
  ) : (
    <p className="live-pill">{label}</p>
  )
}
