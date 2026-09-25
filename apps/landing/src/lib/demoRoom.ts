// DEMO_SESSION_URL is the same viewer link the host prints: "<viewer-origin>/?name=...#<roomId>" or "<viewer-origin>/#<roomId>"
export function extractDemoRoomId(url: string): string | null {
  if (!url) return null
  try {
    return new URL(url).hash.replace(/^#/, "") || null
  } catch {
    return null
  }
}
