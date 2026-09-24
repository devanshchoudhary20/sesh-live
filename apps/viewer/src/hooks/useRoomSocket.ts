import { useEffect, useRef, useState } from "react"

export type ConnectionState = "connecting" | "live" | "ended" | "invalid"

export function useRoomSocket(relay: string | null, room: string | null, onFrame: (data: string) => void) {
  const [state, setState] = useState<ConnectionState>(relay && room ? "connecting" : "invalid")
  const [viewerCount, setViewerCount] = useState<number | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!relay || !room) return
    const socket = new WebSocket(`${relay}/room/${room}?role=viewer`)
    socketRef.current = socket

    socket.onopen = () => {
      setState("live")
      setViewerCount((current) => current ?? 1)
    }
    socket.onmessage = (event) => {
      if (typeof event.data === "string" && event.data.startsWith("{")) {
        const parsed = JSON.parse(event.data) as { viewerCount?: number }
        if (typeof parsed.viewerCount === "number") setViewerCount(parsed.viewerCount)
        return
      }
      onFrame(String(event.data))
    }
    socket.onclose = () => setState((current) => (current === "connecting" ? "invalid" : "ended"))
    socket.onerror = () => setState((current) => (current === "connecting" ? "invalid" : current))

    return () => socket.close()
  }, [relay, room, onFrame])

  return { state, viewerCount }
}
