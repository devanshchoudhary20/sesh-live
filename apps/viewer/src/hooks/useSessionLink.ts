// Link format: https://<viewer-origin>/#<roomId>, the same shape the host CLI prints on start.
export function useSessionLink() {
  const roomId = window.location.hash.replace(/^#/, "") || null
  const name = new URLSearchParams(window.location.search).get("name") ?? "Session"

  return { roomId, name, valid: Boolean(roomId) }
}
