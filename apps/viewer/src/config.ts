// placeholder until a SHIP step points this at the deployed relay; same env var name as apps/landing's config
export const RELAY_URL = import.meta.env.VITE_RELAY_ORIGIN ?? "https://sesh-relay.example.workers.dev"
export const RELAY_WS_URL = RELAY_URL.replace(/^http/, "ws")
