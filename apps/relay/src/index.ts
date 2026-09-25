import type { Env } from "./env";
import { corsHeaders, createRateLimiter, isValidEmail, parseRoomPath } from "./routing";

export { Room } from "./room";
export type { Env };

// dev fallback matches the landing app's Vite default port; SHIP sets ALLOWED_ORIGINS to the deployed Pages + viewer origins
const DEV_ORIGIN_FALLBACK = "http://localhost:5173";
// module-scope so it survives across requests within one Worker isolate; good enough for M0 hygiene, not a hard cap
const signupLimiter = createRateLimiter(5, 10 * 60 * 1000);

function withCors(response: Response, request: Request, env: Env): Response {
  const headers = corsHeaders(request.headers.get("Origin"), env.ALLOWED_ORIGINS ?? DEV_ORIGIN_FALLBACK);
  const merged = new Headers(response.headers);
  for (const [key, value] of Object.entries(headers)) merged.set(key, value);
  return new Response(response.body, { status: response.status, headers: merged });
}

// POST /signup: rate-limited per IP, dedupes by email (INSERT OR IGNORE), always returns the current total count.
async function handleSignup(request: Request, env: Env): Promise<Response> {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (!signupLimiter.attempt(ip, Date.now())) {
    return Response.json({ error: "too many signups from this address, try again later" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim();
  if (!isValidEmail(email)) {
    return Response.json({ error: "invalid email" }, { status: 400 });
  }

  await env.DB.prepare("INSERT OR IGNORE INTO signups (email, created_at) VALUES (?, ?)")
    .bind(email, new Date().toISOString())
    .run();

  return handleSignupCount(env);
}

async function handleSignupCount(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare("SELECT COUNT(*) as count FROM signups").all<{ count: number }>();
  const count = results?.[0]?.count ?? 0;
  return Response.json({ count });
}

// GET /stats: distinct viewer tokens across every room, plus whether any room currently has a host connected.
async function handleAggregateStats(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare("SELECT COUNT(DISTINCT token) as count FROM joins").all<{ count: number }>();
  const viewers = results?.[0]?.count ?? 0;

  const liveRows = await env.DB.prepare("SELECT EXISTS(SELECT 1 FROM rooms WHERE live = 1) as live").all<{ live: number }>();
  const live = Boolean(liveRows.results?.[0]?.live);

  return Response.json({ viewers, live });
}

async function routeRoom(request: Request, env: Env, roomId: string): Promise<Response> {
  const id = env.ROOM.idFromName(roomId);
  const stub = env.ROOM.get(id);
  return stub.fetch(request);
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/signup" && request.method === "POST") return handleSignup(request, env);
  if ((url.pathname === "/signup" || url.pathname === "/signup/count") && request.method === "GET") {
    return handleSignupCount(env);
  }
  if (url.pathname === "/stats" && request.method === "GET") return handleAggregateStats(env);

  const room = parseRoomPath(url.pathname);
  if (room) return routeRoom(request, env, room.roomId);

  return new Response("sesh relay", { status: 200 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), request, env);
    }
    const response = await route(request, env);
    // a 101 Switching Protocols response carries the live socket; adding headers to it would break the upgrade
    return response.status === 101 ? response : withCors(response, request, env);
  },
};
