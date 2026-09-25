// dev default matches wrangler's local relay port so `npm run dev` works with no .env
export const RELAY_ORIGIN = import.meta.env.VITE_RELAY_ORIGIN ?? "http://localhost:8787"
export const GITHUB_URL = "https://github.com/devanshchoudhary20/sesh-live"
export const DEMO_SESSION_URL = import.meta.env.VITE_DEMO_SESSION_URL ?? ""
export const DEMO_VIDEO_URL = import.meta.env.VITE_DEMO_VIDEO_URL ?? "/demo.mp4"
export const DEMO_POSTER_URL = import.meta.env.VITE_DEMO_POSTER_URL ?? "/demo-poster.png"
export const STATS_POLL_MS = 10_000
