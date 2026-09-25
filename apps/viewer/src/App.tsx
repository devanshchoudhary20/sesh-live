import { useCallback, useRef, useState } from "react"
import { useTheme } from "./hooks/useTheme"
import { useSessionLink } from "./hooks/useSessionLink"
import { useRoomSocket } from "./hooks/useRoomSocket"
import { Terminal, type TerminalHandle } from "./components/Terminal"
import "./App.css"

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "/"
const NO_NAME_SUB_COPY = "Claude Code session, read-only stream"

function indicatorCopy(state: "connecting" | "live" | "ended") {
  if (state === "live") return { label: "Live", tone: "live" as const }
  if (state === "ended") return { label: "Ended", tone: "ended" as const }
  return { label: "Connecting…", tone: "idle" as const }
}

// "invalid" is a definite server signal; "connection-error" is a 1006 with no frames, so the copy avoids blaming the link
function terminalCardCopy(state: "invalid" | "connection-error") {
  if (state === "connection-error") {
    return {
      heading: "Can't reach the session",
      body: "Something interrupted the connection before it opened. Check your connection and try the link again.",
    }
  }
  return {
    heading: "This link doesn't work",
    body: "The session link is missing a piece or has expired. Ask whoever sent it for a fresh one, or start your own.",
  }
}

function viewerCountCopy(state: string, count: number | null) {
  if (state === "connecting") return "— viewers"
  if (count === null) return "1 viewer"
  return count === 1 ? "1 viewer" : `${count} viewers`
}

function sessionNameCopy(name: string | null) {
  return name || "Session"
}

function sessionSubCopy(name: string | null) {
  return name ? `${name}, read-only stream` : NO_NAME_SUB_COPY
}

function App() {
  const { theme, toggle } = useTheme()
  const { roomId, name: urlName, valid } = useSessionLink()
  const [hostName, setHostName] = useState<string | null>(urlName)
  const terminalRef = useRef<TerminalHandle>(null)
  const handleFrame = useCallback((data: Uint8Array) => terminalRef.current?.write(data), [])
  const handleResize = useCallback((cols: number, rows: number) => terminalRef.current?.resize(cols, rows), [])
  const handleMeta = useCallback((name: string) => setHostName(name), [])
  const { state, viewerCount } = useRoomSocket(valid ? roomId : null, handleFrame, handleResize, handleMeta)

  if (!valid || state === "invalid" || state === "connection-error") {
    const card = terminalCardCopy(!valid || state === "invalid" ? "invalid" : "connection-error")
    return (
      <main className="invalid-card">
        <h1>{card.heading}</h1>
        <p>{card.body}</p>
        <a className="cta" href={LANDING_URL}>Get the link for your own session</a>
      </main>
    )
  }

  const indicator = indicatorCopy(state)

  return (
    <div className="viewer-page">
      <header className="top-bar">
        <span className="name-block">
          <span className="session-name">{sessionNameCopy(hostName)}</span>
          <span className="session-sub">{sessionSubCopy(hostName)}</span>
        </span>
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
