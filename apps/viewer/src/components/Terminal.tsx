import { useEffect, useImperativeHandle, useRef, forwardRef } from "react"
import { Terminal as XTerm } from "@xterm/xterm"
import "@xterm/xterm/css/xterm.css"

const DARK_THEME = { background: "#000000", foreground: "#ffffff", cursor: "#ffffff" }
const LIGHT_THEME = { background: "#ffffff", foreground: "#000000", cursor: "#000000" }

export type TerminalHandle = { write: (data: string) => void }

function TerminalImpl({ theme }: { theme: "light" | "dark" }, ref: React.Ref<TerminalHandle>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const term = new XTerm({ convertEol: true, disableStdin: true, theme: theme === "dark" ? DARK_THEME : LIGHT_THEME })
    term.open(containerRef.current)
    xtermRef.current = term
    return () => term.dispose()
  }, [])

  useEffect(() => {
    if (xtermRef.current) xtermRef.current.options.theme = theme === "dark" ? DARK_THEME : LIGHT_THEME
  }, [theme])

  useImperativeHandle(ref, () => ({
    write: (data: string) => xtermRef.current?.write(data),
  }))

  return <div className="terminal-mount" ref={containerRef} />
}

export const Terminal = forwardRef(TerminalImpl)
