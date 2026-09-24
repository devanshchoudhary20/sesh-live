import { useCallback, useRef } from "react"
import { useTheme } from "./hooks/useTheme"
import { useSessionLink } from "./hooks/useSessionLink"
import { useRoomSocket } from "./hooks/useRoomSocket"
import { Terminal, type TerminalHandle } from "./components/Terminal"
import "./App.css"

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "/"

function indicatorCopy(state: "connecting" | "live" | "ended" | "invalid") {
  if (state === "live") return { label: "Live", tone: "live" as const }
  if (state === "ended") return { label: "Ended", tone: "ended" as const }
  return { label: "Connecting…", tone: "idle" as const }
}

function viewerCountCopy(state: string, count: number | null) {
  if (state === "connecting") return "— viewers"
  if (count === null) return "1 viewer"
  return count === 1 ? "1 viewer" : `${count} viewers`
}

function App() {
  const { theme, toggle } = useTheme()
  const { roomId, name, valid } = useSessionLink()
  const terminalRef = useRef<TerminalHandle>(null)
  const handleFrame = useCallback((data: Uint8Array) => terminalRef.current?.write(data), [])
  const handleResize = useCallback((cols: number, rows: number) => terminalRef.current?.resize(cols, rows), [])
  const { state, viewerCount } = useRoomSocket(valid ? roomId : null, handleFrame, handleResize)

  if (!valid || state === "invalid") {
    return (
      <div className="invalid-card">
        <h1>This link doesn't work</h1>
        <p>The session link is missing a piece or has expired. Ask whoever sent it for a fresh one, or start your own.</p>
        <a className="cta" href={LANDING_URL}>Get the link for your own session</a>
      </div>
    )
  }

  const indicator = indicatorCopy(state)

  return (
    <div className="viewer-page">
      <header className="top-bar">
        <span className="session-name">{name}</span>
        <span className={`indicator indicator-${indicator.tone}`}>
          <span className="dot" />
          {indicator.label}
        </span>
        <span className="viewer-count">{viewerCountCopy(state, viewerCount)}</span>
        <a className="cta-small" href={LANDING_URL}>Get the link for your own session</a>
        <button type="button" className="theme-toggle" onClick={toggle}>
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </header>

      {state === "ended" && (
        <div className="ended-banner">
          This session has ended. Replay isn't available yet — that's coming in a later milestone.
          <a href={LANDING_URL}>Get the link for your own session</a>
        </div>
      )}

      <main className={`terminal-area ${state === "ended" ? "terminal-area-dimmed" : ""}`}>
        {state === "connecting" ? (
          <p className="connecting-text">Connecting to the session…</p>
        ) : (
          <Terminal ref={terminalRef} theme={theme} />
        )}
      </main>
    </div>
  )
}

export default App
