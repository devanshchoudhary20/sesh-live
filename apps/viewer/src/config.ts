// placeholder until a SHIP step points this at the deployed relay
export const RELAY_URL = import.meta.env.VITE_RELAY_URL ?? "https://sesh-relay.example.workers.dev"
export const RELAY_WS_URL = RELAY_URL.replace(/^http/, "ws")
