CREATE TABLE IF NOT EXISTS signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

-- one row per (viewer token, room): the source for both a room's /r/<id>/stats viewer count and the /stats aggregate.
-- ip backs the per-room, per-IP cap of 3 distinct tokens counted toward the aggregate (hygiene, not an access control).
CREATE TABLE IF NOT EXISTS joins (
  token TEXT NOT NULL,
  room TEXT NOT NULL,
  ip TEXT NOT NULL DEFAULT '',
  first_seen TEXT NOT NULL,
  PRIMARY KEY (token, room)
);

-- one row per room, flipped by the Room DO on host connect/disconnect; the worker has no other way to see across DOs
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  live INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
