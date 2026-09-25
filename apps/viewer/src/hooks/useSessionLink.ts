// Link format: https://<viewer-origin>/#<roomId>; name is an initial value only, the authoritative one arrives as a meta frame.
export function useSessionLink() {
  const roomId = window.location.hash.replace(/^#/, "") || null
  const name = new URLSearchParams(window.location.search).get("name")

  return { roomId, name, valid: Boolean(roomId) }
}
