export interface Env {
  ROOM: DurableObjectNamespace;
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
}
