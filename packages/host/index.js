#!/usr/bin/env node
// M0 PoC: PTY agent bytes stream raw over ws to one relay room, read-only.
import { spawn } from "node-pty";
import WebSocket from "ws";

const [cmd, ...args] = process.argv.slice(2);
const roomId = process.env.SESH_ROOM ?? crypto.randomUUID();
const relayUrl = process.env.SESH_RELAY ?? "ws://127.0.0.1:8787";

const ws = new WebSocket(`${relayUrl}/room/${roomId}?role=host`);
const pty = spawn(cmd ?? "bash", args, { name: "xterm-color", cols: 80, rows: 30 });

ws.on("open", () => console.log(`watch: ${relayUrl.replace("ws", "http")}/room/${roomId}`));
pty.onData((data) => ws.readyState === WebSocket.OPEN && ws.send(data));
pty.onExit(() => ws.close());
process.stdin.on("data", (data) => pty.write(data.toString()));
