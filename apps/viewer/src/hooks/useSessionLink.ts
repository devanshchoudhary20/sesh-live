function parseParams(source: string): URLSearchParams {
  return new URLSearchParams(source.replace(/^[?#]/, ""))
}

export function useSessionLink() {
  const fromQuery = parseParams(window.location.search)
  const fromFragment = parseParams(window.location.hash)

  const relay = fromQuery.get("relay") ?? fromFragment.get("relay")
  const room = fromQuery.get("room") ?? fromFragment.get("room")
  const name = fromQuery.get("name") ?? fromFragment.get("name") ?? "Session"

  return { relay, room, name, valid: Boolean(relay && room) }
}
