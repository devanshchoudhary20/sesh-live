// One Durable Object per room. Fans out host frames to N viewers, no storage.
export class Room {
  state: DurableObjectState;
  host: WebSocket | null = null;
  viewers = new Set<WebSocket>();
  seenViewerIds = new Set<string>();

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") !== "websocket") {
      if (url.pathname.endsWith("/viewers")) {
        return Response.json({ distinctViewers: this.seenViewerIds.size });
      }
      return new Response("expected websocket", { status: 426 });
    }

    const role = url.searchParams.get("role") === "host" ? "host" : "viewer";
    const viewerId = url.searchParams.get("viewerId") ?? crypto.randomUUID();

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    server.accept();

    if (role === "host") {
      this.host = server;
      server.addEventListener("message", (event) => this.broadcast(event.data));
      server.addEventListener("close", () => {
        this.host = null;
      });
    } else {
      this.viewers.add(server);
      this.seenViewerIds.add(viewerId);
      server.addEventListener("close", () => this.viewers.delete(server));
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(data: string | ArrayBuffer) {
    for (const viewer of this.viewers) {
      try {
        viewer.send(data);
      } catch {
        this.viewers.delete(viewer);
      }
    }
  }
}
