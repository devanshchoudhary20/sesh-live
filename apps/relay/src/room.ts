import type { Env } from "./env";
import { appendToRingBuffer, base64ToBuffer, bufferToBase64, resolveRole, type FrameEntry } from "./routing";

const BACKFILL_LIMIT_BYTES = 64 * 1024;
const BACKFILL_KEY = "backfill";
const HOST_TOKEN_KEY = "hostToken";
const VIEWER_KEY_PREFIX = "viewer:";

// One Durable Object per room, on the hibernation API so an idle room costs nothing between frames.
export class Room implements DurableObject {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/stats")) return this.handleStats();

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket", { status: 426 });
    }

    const role = resolveRole(url);
    return role === "host" ? this.acceptHost(url) : this.acceptViewer(url);
  }

  private async acceptHost(url: URL): Promise<Response> {
    const token = url.searchParams.get("token");
    if (!token) return new Response("missing host token", { status: 400 });

    const storedToken = await this.state.storage.get<string>(HOST_TOKEN_KEY);
    if (storedToken && storedToken !== token) {
      return new Response("host token does not match this room", { status: 403 });
    }
    if (!storedToken) await this.state.storage.put(HOST_TOKEN_KEY, token);

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.state.acceptWebSocket(server, ["host"]);
    await this.setLive(true);
    return new Response(null, { status: 101, webSocket: client });
  }

  private async acceptViewer(url: URL): Promise<Response> {
    const viewerToken = url.searchParams.get("v") || crypto.randomUUID();

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.state.acceptWebSocket(server, ["viewer"]);

    await this.recordViewer(viewerToken);
    await this.sendBackfill(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  // Host frames fan out to every connected viewer; viewer messages are ignored (read-only at M0).
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (!this.state.getTags(ws).includes("host")) return;
    await this.appendBackfill(message);
    this.broadcast(message);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    try {
      ws.close(code, reason);
    } catch {
      // socket already closing; nothing to clean up beyond letting hibernation drop it
    }
    if (this.state.getTags(ws).includes("host")) await this.setLive(false);
  }

  private broadcast(data: string | ArrayBuffer): void {
    for (const viewer of this.state.getWebSockets("viewer")) {
      try {
        viewer.send(data);
      } catch {
        // a send to a half-closed socket is not fatal to the room; webSocketClose will reap it
      }
    }
  }

  private async recordViewer(token: string): Promise<void> {
    const key = `${VIEWER_KEY_PREFIX}${token}`;
    const alreadySeen = await this.state.storage.get(key);
    if (alreadySeen) return;
    await this.state.storage.put(key, true);

    const roomId = this.state.id.toString();
    await this.env.DB.prepare("INSERT OR IGNORE INTO joins (token, room, first_seen) VALUES (?, ?, ?)")
      .bind(token, roomId, new Date().toISOString())
      .run();
  }

  private async appendBackfill(message: string | ArrayBuffer): Promise<void> {
    const entry: FrameEntry =
      typeof message === "string"
        ? { binary: false, data: message, size: message.length }
        : { binary: true, data: bufferToBase64(message), size: message.byteLength };

    const current = (await this.state.storage.get<FrameEntry[]>(BACKFILL_KEY)) ?? [];
    await this.state.storage.put(BACKFILL_KEY, appendToRingBuffer(current, entry, BACKFILL_LIMIT_BYTES));
  }

  private async sendBackfill(ws: WebSocket): Promise<void> {
    const frames = (await this.state.storage.get<FrameEntry[]>(BACKFILL_KEY)) ?? [];
    for (const frame of frames) {
      ws.send(frame.binary ? base64ToBuffer(frame.data) : frame.data);
    }
  }

  private async handleStats(): Promise<Response> {
    const live = this.state.getWebSockets("host").length > 0;
    const viewers = await this.countViewers();
    return Response.json({ viewers, live });
  }

  private async countViewers(): Promise<number> {
    const seen = await this.state.storage.list({ prefix: VIEWER_KEY_PREFIX });
    return seen.size;
  }

  // mirrored to D1 so the worker's aggregate /stats can see "any room live" without enumerating every DO
  private async setLive(live: boolean): Promise<void> {
    const roomId = this.state.id.toString();
    await this.env.DB.prepare(
      "INSERT INTO rooms (id, live, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET live = excluded.live, updated_at = excluded.updated_at",
    )
      .bind(roomId, live ? 1 : 0, new Date().toISOString())
      .run();
  }
}
