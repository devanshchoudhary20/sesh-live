import { useEffect, useState } from "react"

type Theme = "light" | "dark"

function prefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (prefersDark() ? "dark" : "light"))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggle = () => setTheme((current) => (current === "dark" ? "light" : "dark"))

  return { theme, toggle }
}
