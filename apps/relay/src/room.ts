import type { Env } from "./env";
import {
  appendToRingBuffer,
  base64ToBuffer,
  buildJoinFrames,
  bufferToBase64,
  closeAllViewers,
  countLiveViewers,
  INVALID_FRAME,
  INVALID_ROOM_CLOSE_CODE,
  isControlFrame,
  resolveRole,
  roomExists,
  type FrameEntry,
} from "./routing";

const BACKFILL_LIMIT_BYTES = 64 * 1024;
const BACKFILL_KEY = "backfill";
const RESIZE_KEY = "resize";
const META_KEY = "meta";
const HOST_TOKEN_KEY = "hostToken";
const ENDED_KEY = "ended";
const VIEWER_KEY_PREFIX = "viewer:";
// aggregate metric cap: a single IP joining the same room over and over should not inflate the "distinct viewers" count
const MAX_VIEWER_TOKENS_PER_IP = 3;

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
    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    return role === "host" ? this.acceptHost(url) : this.acceptViewer(url, ip);
  }

  private async acceptHost(url: URL): Promise<Response> {
    const token = url.searchParams.get("token");
    if (!token) return new Response("missing host token", { status: 400 });

    // token match is only enforced while a host socket is live, so a restarted host can reclaim a pinned SESH_ROOM
    const hostSocketLive = this.state.getWebSockets("host").length > 0;
    const storedToken = await this.state.storage.get<string>(HOST_TOKEN_KEY);
    if (storedToken && storedToken !== token && hostSocketLive) {
      return new Response("host token does not match this room", { status: 403 });
    }
    if (storedToken !== token) await this.state.storage.put(HOST_TOKEN_KEY, token);

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.state.acceptWebSocket(server, ["host"]);
    await this.state.storage.delete(ENDED_KEY);
    await this.setLive(true);
    return new Response(null, { status: 101, webSocket: client });
  }

  private async acceptViewer(url: URL, ip: string): Promise<Response> {
    const created = await this.state.storage.get(HOST_TOKEN_KEY);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

    if (!roomExists(created)) {
      // accept the upgrade so the client gets a real WS close (4404) instead of a bare HTTP 404, which reads as a network failure
      server.accept();
      server.send(INVALID_FRAME);
      server.close(INVALID_ROOM_CLOSE_CODE, "room does not exist");
      return new Response(null, { status: 101, webSocket: client });
    }

    const viewerToken = url.searchParams.get("v") || crypto.randomUUID();
    this.state.acceptWebSocket(server, ["viewer"]);

    await this.recordViewer(viewerToken, ip);
    await this.sendJoinFrames(server);

    // a late joiner on an already-ended room should see "ended" immediately, not hang in "connecting"; sendJoinFrames already queued the ended frame
    if (await this.state.storage.get(ENDED_KEY)) server.close(1000, "host ended");

    return new Response(null, { status: 101, webSocket: client });
  }

  // Host frames fan out to every connected viewer; a viewer's only message is a replay request (read-only at M0 otherwise).
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const tags = this.state.getTags(ws);
    if (tags.includes("viewer")) {
      // a remounted terminal can't trust its local queue, so it asks for the same meta/resize/backfill burst a fresh join gets
      if (isControlFrame(message, "replay")) await this.sendJoinFrames(ws);
      return;
    }
    if (!tags.includes("host")) return;
    if (isControlFrame(message, "resize")) await this.state.storage.put(RESIZE_KEY, message as string);
    if (isControlFrame(message, "meta")) await this.state.storage.put(META_KEY, message as string);
    await this.appendBackfill(message);
    this.broadcast(message);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    try {
      ws.close(code, reason);
    } catch {
      // socket already closing; nothing to clean up beyond letting hibernation drop it
    }
    if (this.state.getTags(ws).includes("host")) await this.endSession();
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    if (this.state.getTags(ws).includes("host")) await this.endSession();
  }

  // Fires once, on whichever event reaches the host socket first: tells every viewer the room is over.
  private async endSession(): Promise<void> {
    closeAllViewers(this.state.getWebSockets("viewer"));
    await this.setLive(false);
    await this.state.storage.put(ENDED_KEY, true);
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

  private async recordViewer(token: string, ip: string): Promise<void> {
    const key = `${VIEWER_KEY_PREFIX}${token}`;
    const alreadySeen = await this.state.storage.get(key);
    if (alreadySeen) return;
    await this.state.storage.put(key, true);

    const roomId = this.state.id.toString();
    const { results } = await this.env.DB.prepare("SELECT COUNT(*) as count FROM joins WHERE room = ? AND ip = ?")
      .bind(roomId, ip)
      .all<{ count: number }>();
    if ((results?.[0]?.count ?? 0) >= MAX_VIEWER_TOKENS_PER_IP) return;

    await this.env.DB.prepare("INSERT OR IGNORE INTO joins (token, room, ip, first_seen) VALUES (?, ?, ?, ?)")
      .bind(token, roomId, ip, new Date().toISOString())
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

  // Meta/resize lead the backfill and shared by both a fresh join and a "replay" request, so a reconnect into an ended room still gets the ended frame.
  private async sendJoinFrames(ws: WebSocket): Promise<void> {
    const meta = (await this.state.storage.get<string>(META_KEY)) ?? null;
    const resize = (await this.state.storage.get<string>(RESIZE_KEY)) ?? null;
    const backfill = (await this.state.storage.get<FrameEntry[]>(BACKFILL_KEY)) ?? [];
    const ended = Boolean(await this.state.storage.get(ENDED_KEY));
    for (const frame of buildJoinFrames(meta, resize, backfill, ended)) {
      ws.send(typeof frame === "string" ? frame : frame.binary ? base64ToBuffer(frame.data) : frame.data);
    }
  }

  private async handleStats(): Promise<Response> {
    const live = this.state.getWebSockets("host").length > 0;
    const viewers = countLiveViewers(this.state.getWebSockets("viewer"));
    return Response.json({ viewers, live });
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
