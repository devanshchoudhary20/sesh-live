import { useEffect, useImperativeHandle, useRef, forwardRef } from "react"
import { Terminal as XTerm } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { computeTerminalScale } from "../lib/terminalScale"
import "@xterm/xterm/css/xterm.css"

const DARK_THEME = { background: "#000000", foreground: "#ffffff", cursor: "#ffffff" }
const LIGHT_THEME = { background: "#ffffff", foreground: "#000000", cursor: "#000000" }

export type TerminalHandle = {
  write: (data: Uint8Array) => void
  resize: (cols: number, rows: number) => void
}

function TerminalImpl({ theme }: { theme: "light" | "dark" }, ref: React.Ref<TerminalHandle>) {
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

    return () => {
      window.removeEventListener("resize", handleWindowResize)
      term.dispose()
    }
  }, [])

  useEffect(() => {
    if (xtermRef.current) xtermRef.current.options.theme = theme === "dark" ? DARK_THEME : LIGHT_THEME
  }, [theme])

  useImperativeHandle(ref, () => ({
    write: (data: Uint8Array) => xtermRef.current?.write(data),
    // host-driven size is authoritative for a correct TUI redraw, so this overrides the last viewport fit
    resize: (cols: number, rows: number) => {
      hostSizeKnownRef.current = true
      xtermRef.current?.resize(cols, rows)
      requestAnimationFrame(applyScale)
    },
  }))

  return (
    <div className="terminal-mount" ref={outerRef}>
      <div className="terminal-scale" ref={innerRef} />
    </div>
  )
}

export const Terminal = forwardRef(TerminalImpl)
