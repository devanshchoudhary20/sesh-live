import { useEffect, useState } from "react"
import { RELAY_URL, RELAY_WS_URL } from "../config"
import { reduceConnectionState, type ConnectionState, type SocketEvent } from "../lib/connectionState"
import { useViewerToken } from "./useViewerToken"

export type { ConnectionState }

type ControlFrame = { type: "resize"; cols: number; rows: number } | { type: "ended" } | { type: "invalid" } | null

type SocketHandlers = {
  onFrame: (data: Uint8Array) => void
  onResize: (cols: number, rows: number) => void
  dispatch: (event: SocketEvent) => void
}

const STATS_POLL_MS = 10_000

// Terminal bytes travel as binary frames; resize/ended/invalid control messages travel as JSON text, so they never collide.
function parseControlFrame(raw: string): ControlFrame {
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.type === "resize" && typeof parsed.cols === "number" && typeof parsed.rows === "number") return parsed
    if (parsed?.type === "ended") return { type: "ended" }
    if (parsed?.type === "invalid") return { type: "invalid" }
    return null
  } catch {
    return null
  }
}

// `active` scopes every handler to this call's own socket, so a StrictMode remount's stale socket can never dispatch after cleanup.
export function connectRoomSocket(url: string, handlers: SocketHandlers): () => void {
  let active = true
  const socket = new WebSocket(url)
  socket.binaryType = "arraybuffer"

  socket.onopen = () => {
    if (!active) return
    handlers.dispatch({ type: "open" })
  }
  socket.onmessage = (event) => {
    if (!active) return
    if (typeof event.data === "string") {
      const frame = parseControlFrame(event.data)
      if (frame?.type === "resize") handlers.onResize(frame.cols, frame.rows)
      if (frame?.type === "ended" || frame?.type === "invalid") {
        handlers.dispatch({ type: "control-frame", frame: frame.type })
      }
      return
    }
    handlers.onFrame(new Uint8Array(event.data as ArrayBuffer))
  }
  // onerror carries no code; the close event that always follows it is what the state machine decides on
  socket.onclose = (event) => {
    if (!active) return
    handlers.dispatch({ type: "close", code: event.code })
  }

  return () => {
    active = false
    socket.onopen = null
    socket.onmessage = null
    socket.onclose = null
    socket.close(1000)
  }
}

export function useRoomSocket(
  roomId: string | null,
  onFrame: (data: Uint8Array) => void,
  onResize: (cols: number, rows: number) => void,
) {
  const viewerToken = useViewerToken()
  const [state, setState] = useState<ConnectionState>(roomId ? "connecting" : "invalid")
  const [viewerCount, setViewerCount] = useState<number | null>(null)

  useEffect(() => {
    if (!roomId) return
    const dispatch = (event: SocketEvent) => setState((current) => reduceConnectionState(current, event))
    return connectRoomSocket(`${RELAY_WS_URL}/r/${roomId}?role=viewer&v=${viewerToken}`, { onFrame, onResize, dispatch })
  }, [roomId, viewerToken, onFrame, onResize])

  useEffect(() => {
    if (!roomId || state === "invalid" || state === "connection-error") return
    let cancelled = false

    const poll = () => {
      fetch(`${RELAY_URL}/r/${roomId}/stats`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { viewers?: number } | null) => {
          if (!cancelled && typeof data?.viewers === "number") setViewerCount(data.viewers)
        })
        .catch(() => undefined)
    }

    poll()
    const interval = setInterval(poll, STATS_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [roomId, state])

  return { state, viewerCount }
}
