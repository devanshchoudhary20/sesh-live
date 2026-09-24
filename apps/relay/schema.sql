CREATE TABLE IF NOT EXISTS signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

-- one row per (viewer token, room): the source for both a room's /r/<id>/stats viewer count and the /stats aggregate
CREATE TABLE IF NOT EXISTS joins (
  token TEXT NOT NULL,
  room TEXT NOT NULL,
  first_seen TEXT NOT NULL,
  PRIMARY KEY (token, room)
);
