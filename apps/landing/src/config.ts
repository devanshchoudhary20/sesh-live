// dev default matches wrangler's local relay port so `npm run dev` works with no .env
export const RELAY_ORIGIN = import.meta.env.VITE_RELAY_ORIGIN ?? "http://localhost:8787"
export const GITHUB_URL = "https://github.com/devanshchoudhary20/sesh-live"
export const DEMO_SESSION_URL = import.meta.env.VITE_DEMO_SESSION_URL ?? ""
// unset at build time until a real clip lands; an empty string, not a path to a file that doesn't exist yet
export const DEMO_VIDEO_URL = import.meta.env.VITE_DEMO_VIDEO_URL ?? ""
export const DEMO_POSTER_URL = import.meta.env.VITE_DEMO_POSTER_URL ?? "/demo-poster.png"
export const STATS_POLL_MS = 10_000
