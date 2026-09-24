import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createFrameBatcher, encodeEndedFrame, encodeResizeFrame, nextBackoffMs } from "./lib.js";

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
});

describe("nextBackoffMs", () => {
  it("doubles per attempt and caps at 5s", () => {
    expect(nextBackoffMs(0)).toBe(500);
    expect(nextBackoffMs(1)).toBe(1000);
    expect(nextBackoffMs(10)).toBe(5000);
  });
});
