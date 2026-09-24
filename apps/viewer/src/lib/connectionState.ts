export type ConnectionState = "connecting" | "live" | "ended" | "invalid" | "connection-error"

export const INVALID_ROOM_CLOSE_CODE = 4404

export type SocketEvent =
  | { type: "open" }
  | { type: "control-frame"; frame: "ended" | "invalid" }
  | { type: "close"; code: number }

export const TERMINAL_STATES: ReadonlySet<ConnectionState> = new Set(["invalid", "ended", "connection-error"])

// Terminal states never move again; a close while still "connecting" means no frame ever arrived (open always precedes message)
export function reduceConnectionState(current: ConnectionState, event: SocketEvent): ConnectionState {
  if (TERMINAL_STATES.has(current)) return current

  switch (event.type) {
    case "open":
      return "live"
    case "control-frame":
      return event.frame === "invalid" ? "invalid" : "ended"
    case "close":
      if (event.code === INVALID_ROOM_CLOSE_CODE) return "invalid"
      return current === "connecting" ? "connection-error" : "ended"
  }
}
