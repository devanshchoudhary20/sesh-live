// Pure pieces of the streamer: frame batching and control-frame encoding, kept free of node-pty/ws so they're plain-function testable.

// Batches Buffer chunks and flushes the concatenation on a fixed interval, matching the plan's "batched at 50 ms".
export function createFrameBatcher(onFlush, intervalMs = 50) {
  let pending = [];
  const timer = setInterval(() => {
    if (pending.length === 0) return;
    const combined = Buffer.concat(pending);
    pending = [];
    onFlush(combined);
  }, intervalMs);
  if (typeof timer.unref === "function") timer.unref();

  return {
    push(chunk) {
      pending.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    },
    stop() {
      clearInterval(timer);
    },
  };
}

// Control frames travel as JSON text so the relay/viewer can tell them apart from binary PTY output.
export function encodeResizeFrame(cols, rows) {
  return JSON.stringify({ type: "resize", cols, rows });
}

export function encodeEndedFrame() {
  return JSON.stringify({ type: "ended" });
}

// Exponential backoff capped at 5s, resetting after a successful connection.
export function nextBackoffMs(attempt) {
  return Math.min(500 * 2 ** attempt, 5000);
}

// Resolves once the socket's "close" event fires, or after timeoutMs, whichever comes first, so the ended frame gets a chance to flush before the process exits.
export function waitForClose(ws, timeoutMs = 1500) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, timeoutMs);
    if (typeof timer.unref === "function") timer.unref();
    ws.once("close", finish);
  });
}
