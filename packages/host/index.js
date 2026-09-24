#!/usr/bin/env node
// sesh <agent command>: PTY wrapper that streams the session to the relay and prints a share link.
import { randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node-pty";
import WebSocket from "ws";
import { createFrameBatcher, encodeEndedFrame, encodeResizeFrame, nextBackoffMs, waitForClose } from "./lib.js";

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error("usage: sesh <agent command>, e.g. sesh claude");
  process.exit(1);
}

// placeholders until SHIP fills in the real deployed relay/viewer origins
const relayOrigin = process.env.SESH_RELAY ?? "wss://sesh-relay.example.workers.dev";
const viewerOrigin = process.env.SESH_VIEWER ?? "https://sesh.example.dev";

const roomId = randomUUID();
const hostToken = randomBytes(16).toString("hex");
const roomUrl = `${relayOrigin}/r/${roomId}?role=host&token=${hostToken}`;

console.log(`watch: ${viewerOrigin}/#${roomId}`);

const pty = spawn(cmd, args, {
  name: "xterm-color",
  cols: process.stdout.columns || 80,
  rows: process.stdout.rows || 30,
  env: process.env,
});

let ws = null;
let attempt = 0;
let closing = false;

function sendIfOpen(data) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(data);
}

function connect() {
  ws = new WebSocket(roomUrl);
  ws.on("open", () => {
    attempt = 0;
  });
  ws.on("close", () => {
    if (closing) return;
    setTimeout(connect, nextBackoffMs(attempt++));
  });
  ws.on("error", () => {
    // the close handler that follows owns the retry; nothing extra to do on a socket error
  });
}
connect();

const batcher = createFrameBatcher(sendIfOpen, 50);
pty.onData((data) => {
  process.stdout.write(data);
  batcher.push(data);
});

if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on("data", (data) => pty.write(data.toString("utf8")));

process.on("SIGWINCH", () => {
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 30;
  pty.resize(cols, rows);
  sendIfOpen(encodeResizeFrame(cols, rows));
});

pty.onExit(async ({ exitCode }) => {
  closing = true;
  batcher.stop();
  sendIfOpen(encodeEndedFrame());
  if (ws) {
    const closed = waitForClose(ws);
    ws.close();
    await closed;
  }
  process.stdin.pause();
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.exit(exitCode ?? 0);
});
