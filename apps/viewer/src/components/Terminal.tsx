import { useEffect, useRef } from "react"
import { Terminal as XTerm, type ITheme } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { computeTerminalScale } from "../lib/terminalScale"
import type { TerminalController } from "../lib/terminalController"
import "@xterm/xterm/css/xterm.css"

const DARK_THEME: ITheme = { background: "#000000", foreground: "#ffffff", cursor: "#ffffff" }
// xterm.js's default Tango palette is illegible on white (bold-yellow status text measured 1.63:1); every value here clears 4.5:1 on #ffffff for the standard set, 3:1 for bright
const LIGHT_THEME: ITheme = {
  background: "#ffffff",
  foreground: "#000000",
  cursor: "#000000",
  black: "#1a1a1a",
  red: "#b21212",
  green: "#2e7d32",
  yellow: "#8a5200",
  blue: "#1a56b0",
  magenta: "#8a3ea6",
  cyan: "#0b7285",
  white: "#4b4b4b",
  brightBlack: "#5f5f5f",
  brightRed: "#c62828",
  brightGreen: "#3a8a3f",
  brightYellow: "#8a5200",
  brightBlue: "#2f6fd6",
  brightMagenta: "#a24bc4",
  brightCyan: "#0f8fa8",
  brightWhite: "#6b6b6b",
}

export function Terminal({ theme, controller }: { theme: "light" | "dark"; controller: TerminalController }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
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
    const term = new XTerm({ disableStdin: true, theme: theme === "dark" ? DARK_THEME : LIGHT_THEME })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(innerRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    const handleWindowResize = () => (hostSizeKnownRef.current ? applyScale() : fitAddon.fit())
    window.addEventListener("resize", handleWindowResize)

    // controller.mount() flushes any resize/write the app queued while this effect hadn't run yet (late joiner burst)
    controller.mount({
      write: (data: Uint8Array) => term.write(data),
      // host-driven size is authoritative for a correct TUI redraw, so this overrides the last viewport fit
      resize: (cols: number, rows: number) => {
        hostSizeKnownRef.current = true
        term.resize(cols, rows)
        requestAnimationFrame(applyScale)
      },
    })

    return () => {
      window.removeEventListener("resize", handleWindowResize)
      controller.unmount()
      term.dispose()
    }
  }, [controller])

  useEffect(() => {
    if (xtermRef.current) xtermRef.current.options.theme = theme === "dark" ? DARK_THEME : LIGHT_THEME
  }, [theme])

  return (
    <div className="terminal-mount" ref={outerRef}>
      <div className="terminal-scale" ref={innerRef} />
    </div>
  )
}
