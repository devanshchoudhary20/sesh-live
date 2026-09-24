// Pure helpers: room path parsing, ring-buffer eviction, CORS, email validation. No DO/D1 access, so plain vitest covers them without a workers runtime.

export interface ParsedRoomPath {
  roomId: string;
  isStats: boolean;
}

// Matches "/r/<id>" and "/r/<id>/stats"; returns null for anything else.
export function parseRoomPath(pathname: string): ParsedRoomPath | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "r" || !parts[1]) return null;
  if (parts.length === 2) return { roomId: parts[1], isStats: false };
  if (parts.length === 3 && parts[2] === "stats") return { roomId: parts[1], isStats: true };
  return null;
}

export function resolveRole(url: URL): "host" | "viewer" {
  return url.searchParams.get("role") === "host" ? "host" : "viewer";
}

export interface FrameEntry {
  binary: boolean;
  data: string;
  size: number;
}

// Appends an entry and evicts from the front until the buffer is back under the byte limit.
export function appendToRingBuffer(buffer: FrameEntry[], entry: FrameEntry, limitBytes: number): FrameEntry[] {
  const next = [...buffer, entry];
  let total = next.reduce((sum, frame) => sum + frame.size, 0);
  while (total > limitBytes && next.length > 1) {
    total -= next.shift()!.size;
  }
  return total > limitBytes ? [] : next;
}

// btoa/atob operate on binary strings; both Workers and Node 18+ expose them globally.
export function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// Live viewer count is the open-socket count for this room, not the distinct-token count that D1 tracks for the aggregate metric.
export function countLiveViewers(viewerSockets: unknown[]): number {
  return viewerSockets.length;
}

export interface ClosableSocket {
  send(data: string): void;
  close(code: number, reason?: string): void;
}

export const ENDED_FRAME = JSON.stringify({ type: "ended" });
export const INVALID_FRAME = JSON.stringify({ type: "invalid" });
// Close code for a viewer socket opened against a room that never had a host, so the client gets a reliable signal
export const INVALID_ROOM_CLOSE_CODE = 4404;

// A room only exists once its host has connected at least once and written the host token.
export function roomExists(createdMarker: unknown): boolean {
  return Boolean(createdMarker);
}

// Broadcasts the ended frame then closes every viewer with 1000 so no socket is left dangling after the host leaves.
export function closeAllViewers(viewers: Iterable<ClosableSocket>): void {
  for (const viewer of viewers) {
    try {
      viewer.send(ENDED_FRAME);
    } catch {
      // a send to an already-closing socket is not fatal to session teardown
    }
    try {
      viewer.close(1000, "host ended");
    } catch {
      // already closing
    }
  }
}

export function isValidEmail(email: string | undefined | null): email is string {
  if (!email) return false;
  const trimmed = email.trim();
  return trimmed.length >= 3 && trimmed.includes("@") && !trimmed.includes(" ");
}

// allowedOrigin "*" allows every caller; otherwise only the request's own origin, if it matches, is echoed back.
export function corsHeaders(origin: string | null, allowedOrigin: string): Record<string, string> {
  const allowOrigin = allowedOrigin === "*" ? "*" : origin === allowedOrigin ? allowedOrigin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
