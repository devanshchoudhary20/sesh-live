import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  createFrameBatcher,
  encodeEndedFrame,
  encodeMetaFrame,
  encodeResizeFrame,
  nextBackoffMs,
  parseHostArgs,
  waitForClose,
} from "./lib.js";

describe("createFrameBatcher", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("combines pushes within one interval into a single flush", () => {
    const flushes = [];
    const batcher = createFrameBatcher((chunk) => flushes.push(chunk), 50);

    batcher.push("hel");
    batcher.push(Buffer.from("lo"));
    vi.advanceTimersByTime(50);

    expect(flushes).toHaveLength(1);
    expect(flushes[0].toString()).toBe("hello");
    batcher.stop();
  });

  it("does not flush an empty interval", () => {
    const flushes = [];
    const batcher = createFrameBatcher((chunk) => flushes.push(chunk), 50);

    vi.advanceTimersByTime(200);

    expect(flushes).toHaveLength(0);
    batcher.stop();
  });

  it("starts a fresh batch after each flush", () => {
    const flushes = [];
    const batcher = createFrameBatcher((chunk) => flushes.push(chunk), 50);

    batcher.push("a");
    vi.advanceTimersByTime(50);
    batcher.push("b");
    vi.advanceTimersByTime(50);

    expect(flushes.map((f) => f.toString())).toEqual(["a", "b"]);
    batcher.stop();
  });
});

describe("control frame encoding", () => {
  it("encodes a resize frame as typed JSON", () => {
    expect(JSON.parse(encodeResizeFrame(120, 40))).toEqual({ type: "resize", cols: 120, rows: 40 });
  });

  it("encodes an ended frame as typed JSON", () => {
    expect(JSON.parse(encodeEndedFrame())).toEqual({ type: "ended" });
  });

  it("encodes a meta frame with the session name", () => {
    expect(JSON.parse(encodeMetaFrame("Devansh's Claude Code"))).toEqual({
      type: "meta",
      name: "Devansh's Claude Code",
    });
  });
});

describe("parseHostArgs", () => {
  it("pulls --room and --name out from anywhere in argv", () => {
    expect(parseHostArgs(["--room", "abc123", "claude", "--name", "Devansh's Claude Code"])).toEqual({
      room: "abc123",
      name: "Devansh's Claude Code",
      cmd: "claude",
      cmdArgs: [],
    });
  });

  it("defaults room and name to null when absent", () => {
    expect(parseHostArgs(["claude"])).toEqual({ room: null, name: null, cmd: "claude", cmdArgs: [] });
  });

  it("keeps the agent command's own args intact", () => {
    expect(parseHostArgs(["bash", "-c", "echo hi"])).toEqual({
      room: null,
      name: null,
      cmd: "bash",
      cmdArgs: ["-c", "echo hi"],
    });
  });
});

describe("nextBackoffMs", () => {
  it("doubles per attempt and caps at 5s", () => {
    expect(nextBackoffMs(0)).toBe(500);
    expect(nextBackoffMs(1)).toBe(1000);
    expect(nextBackoffMs(10)).toBe(5000);
  });
});

describe("waitForClose", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("resolves as soon as the socket emits close", async () => {
    const handlers = {};
    const ws = { once: (event, cb) => (handlers[event] = cb) };
    const settled = vi.fn();

    waitForClose(ws, 1500).then(settled);
    expect(settled).not.toHaveBeenCalled();
    handlers.close();
    await Promise.resolve();

    expect(settled).toHaveBeenCalledTimes(1);
  });

  it("resolves after the timeout if close never fires", async () => {
    const ws = { once: () => undefined };
    const settled = vi.fn();

    waitForClose(ws, 1500).then(settled);
    await vi.advanceTimersByTimeAsync(1500);

    expect(settled).toHaveBeenCalledTimes(1);
  });
});
