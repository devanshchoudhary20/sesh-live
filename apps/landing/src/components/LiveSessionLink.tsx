import { useLiveSession } from "../hooks/useLiveSession"
import { DEMO_SESSION_URL } from "../config"

const NO_LIVE_SESSION_COPY =
  "No live session right now — check back during a posting window, or leave your email below."

export function LiveSessionLink() {
  const { live } = useLiveSession()
  const showLink = live && Boolean(DEMO_SESSION_URL)

  return (
    <p className="live-link">
      {showLink ? <a href={DEMO_SESSION_URL}>watch a live session now</a> : NO_LIVE_SESSION_COPY}
    </p>
  )
}
