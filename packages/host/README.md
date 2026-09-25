# sesh-live

Run this instead of your agent CLI:

```
npx sesh-live claude
```

`sesh-live` wraps the command in a PTY, streams the terminal to a relay, and prints a link. Send the link to a friend and they watch the session live in a browser, read-only.

Flags:
- `--room <id>` (or `SESH_ROOM=<id>`) pins the room id so the printed link stays the same across restarts.
- `--name "Devansh's Claude Code"` labels the session for viewers.

The agent process itself never leaves your laptop; only the terminal bytes are relayed.
