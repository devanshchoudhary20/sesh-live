import { useEffect, useImperativeHandle, useRef, forwardRef } from "react"
import { Terminal as XTerm } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"

const DARK_THEME = { background: "#000000", foreground: "#ffffff", cursor: "#ffffff" }
const LIGHT_THEME = { background: "#ffffff", foreground: "#000000", cursor: "#000000" }

export type TerminalHandle = {
  write: (data: Uint8Array) => void
  resize: (cols: number, rows: number) => void
}

function TerminalImpl({ theme }: { theme: "light" | "dark" }, ref: React.Ref<TerminalHandle>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const term = new XTerm({ disableStdin: true, theme: theme === "dark" ? DARK_THEME : LIGHT_THEME })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    const handleWindowResize = () => fitAddon.fit()
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
    resize: (cols: number, rows: number) => xtermRef.current?.resize(cols, rows),
  }))

  return <div className="terminal-mount" ref={containerRef} />
}

export const Terminal = forwardRef(TerminalImpl)
