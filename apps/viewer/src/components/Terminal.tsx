import { useEffect, useRef } from "react"
import { Terminal as XTerm, type ITheme } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { computeTerminalScale } from "../lib/terminalScale"
import type { TerminalController } from "../lib/terminalController"
import "@xterm/xterm/css/xterm.css"

// Claude Code emits truecolor escapes that bypass xterm's theme, so the terminal stays dark in both page themes (see .anbu/screens.md); of the default dark ANSI 16, only brightBlack/magenta/brightMagenta fail axe contrast on #000000 and are pulled lighter here.
const DARK_THEME: ITheme = {
  background: "#000000",
  foreground: "#ffffff",
  cursor: "#ffffff",
  black: "#000000",
  red: "#cd3131",
  green: "#0dbc79",
  yellow: "#e5e510",
  blue: "#2472c8",
  magenta: "#d783ff",
  cyan: "#11a8cd",
  white: "#e5e5e5",
  brightBlack: "#8b8b8b",
  brightRed: "#f14c4c",
  brightGreen: "#23d18b",
  brightYellow: "#f5f543",
  brightBlue: "#3b8eea",
  brightMagenta: "#e6adff",
  brightCyan: "#29b8db",
  brightWhite: "#ffffff",
}

export function Terminal({ controller, onAttach }: { controller: TerminalController; onAttach: () => void }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  // once a host resize frame arrives the grid is authoritative, so window resizes scale the canvas instead of re-fitting it
  const hostSizeKnownRef = useRef(false)

  // CSS transform doesn't change layout size, so offsetWidth/Height stay the terminal's natural (untransformed) grid size
  const applyScale = () => {
    if (!outerRef.current || !innerRef.current) return
    const scale = computeTerminalScale(
      { width: outerRef.current.clientWidth, height: outerRef.current.clientHeight },
      { width: innerRef.current.offsetWidth, height: innerRef.current.offsetHeight },
    )
    innerRef.current.style.transform = `scale(${scale})`
  }

  useEffect(() => {
    if (!innerRef.current) return
    const term = new XTerm({ disableStdin: true, theme: DARK_THEME })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(innerRef.current)
    fitAddon.fit()

    const handleWindowResize = () => (hostSizeKnownRef.current ? applyScale() : fitAddon.fit())
    window.addEventListener("resize", handleWindowResize)

    // controller.attach() replays the full local queue (late joiner burst) into this instance regardless of prior detaches
    controller.attach({
      write: (data: Uint8Array) => term.write(data),
      // host-driven size is authoritative for a correct TUI redraw, so this overrides the last viewport fit
      resize: (cols: number, rows: number) => {
        hostSizeKnownRef.current = true
        term.resize(cols, rows)
        requestAnimationFrame(applyScale)
      },
    })
    // a remount can't trust the local queue alone; ask the relay for a fresh meta/resize/backfill burst too
    onAttach()

    return () => {
      window.removeEventListener("resize", handleWindowResize)
      controller.detach()
      term.dispose()
    }
  }, [controller, onAttach])

  return (
    <div className="terminal-mount" ref={outerRef}>
      <div className="terminal-scale" ref={innerRef} />
    </div>
  )
}
