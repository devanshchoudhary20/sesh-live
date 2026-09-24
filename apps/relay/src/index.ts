export { Room } from "./room";

export interface Env {
  ROOM: DurableObjectNamespace;
  DB: D1Database;
}

// POST /signup: writes an email to D1, returns the running signup count.
async function handleSignup(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim();
  if (!email || !email.includes("@")) {
    return Response.json({ error: "invalid email" }, { status: 400 });
  }

  await env.DB.prepare("INSERT INTO signups (email, created_at) VALUES (?, ?)")
    .bind(email, new Date().toISOString())
    .run();

  const { results } = await env.DB.prepare("SELECT COUNT(*) as count FROM signups").all<{ count: number }>();
  const count = results?.[0]?.count ?? 0;
  return Response.json({ count });
}

async function handleSignupCount(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare("SELECT COUNT(*) as count FROM signups").all<{ count: number }>();
  const count = results?.[0]?.count ?? 0;
  return Response.json({ count });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/signup" && request.method === "POST") {
      return handleSignup(request, env);
    }
    if (url.pathname === "/signup" && request.method === "GET") {
      return handleSignupCount(env);
    }

    if (url.pathname.startsWith("/room/")) {
      const roomId = url.pathname.split("/")[2];
      if (!roomId) return new Response("missing room id", { status: 400 });
      const id = env.ROOM.idFromName(roomId);
      const stub = env.ROOM.get(id);
      return stub.fetch(request);
    }

    return new Response("sesh relay", { status: 200 });
  },
};
