import { describe, expect, it, vi } from "vitest";
import {
  appendToRingBuffer,
  base64ToBuffer,
  bufferToBase64,
  buildJoinFrames,
  closeAllViewers,
  corsHeaders,
  countLiveViewers,
  createRateLimiter,
  ENDED_FRAME,
  isControlFrame,
  isValidEmail,
  parseRoomPath,
  resolveRole,
  roomExists,
  type ClosableSocket,
  type FrameEntry,
} from "./routing";

describe("parseRoomPath", () => {
  it("parses a room websocket path", () => {
    expect(parseRoomPath("/r/abc123")).toEqual({ roomId: "abc123", isStats: false });
  });

  it("parses a room stats path", () => {
    expect(parseRoomPath("/r/abc123/stats")).toEqual({ roomId: "abc123", isStats: true });
  });

  it("rejects paths outside the room namespace", () => {
    expect(parseRoomPath("/signup")).toBeNull();
    expect(parseRoomPath("/r/")).toBeNull();
    expect(parseRoomPath("/r/abc/other")).toBeNull();
  });
});

describe("resolveRole", () => {
  it("defaults to viewer for anything but role=host", () => {
    expect(resolveRole(new URL("https://x/r/1?role=host"))).toBe("host");
    expect(resolveRole(new URL("https://x/r/1?role=viewer"))).toBe("viewer");
    expect(resolveRole(new URL("https://x/r/1"))).toBe("viewer");
  });
});

describe("appendToRingBuffer", () => {
  const entry = (size: number): FrameEntry => ({ binary: true, data: "x".repeat(size), size });

  it("keeps every frame under the byte limit", () => {
    const buffer = appendToRingBuffer(appendToRingBuffer([], entry(10), 100), entry(20), 100);
    expect(buffer.map((f) => f.size)).toEqual([10, 20]);
  });

  it("evicts the oldest frames once the limit is crossed", () => {
    let buffer: FrameEntry[] = [];
    buffer = appendToRingBuffer(buffer, entry(60), 100);
    buffer = appendToRingBuffer(buffer, entry(60), 100);
    expect(buffer.map((f) => f.size)).toEqual([60]);
  });

  it("drops everything if a single frame exceeds the limit alone", () => {
    const buffer = appendToRingBuffer([], entry(200), 100);
    expect(buffer).toEqual([]);
  });
});

describe("isValidEmail", () => {
  it("accepts a plausible address", () => {
    expect(isValidEmail("dev@example.com")).toBe(true);
  });

  it("rejects missing, spaced, or bare-word input", () => {
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not an email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(true);
  });
});

describe("base64 round trip", () => {
  it("preserves binary frame bytes through DO storage encoding", () => {
    const original = new Uint8Array([0, 1, 2, 250, 255, 127]);
    const roundTripped = new Uint8Array(base64ToBuffer(bufferToBase64(original.buffer)));
    expect(Array.from(roundTripped)).toEqual(Array.from(original));
  });
});

describe("countLiveViewers", () => {
  it("counts open sockets, not distinct visitor tokens", () => {
    expect(countLiveViewers([{}, {}, {}])).toBe(3);
    expect(countLiveViewers([])).toBe(0);
  });
});

describe("roomExists", () => {
  it("is true only once the host has written a created marker", () => {
    expect(roomExists("some-host-token")).toBe(true);
    expect(roomExists(undefined)).toBe(false);
    expect(roomExists(null)).toBe(false);
  });
});

describe("closeAllViewers", () => {
  const makeSocket = (): ClosableSocket => ({ send: vi.fn(), close: vi.fn() });

  it("sends the ended frame then closes every viewer with 1000", () => {
    const viewers = [makeSocket(), makeSocket()];
    closeAllViewers(viewers);
    for (const viewer of viewers) {
      expect(viewer.send).toHaveBeenCalledWith(ENDED_FRAME);
      expect(viewer.close).toHaveBeenCalledWith(1000, "host ended");
    }
  });

  it("keeps closing the rest even if one viewer's send throws", () => {
    const broken: ClosableSocket = {
      send: () => {
        throw new Error("socket already gone");
      },
      close: vi.fn(),
    };
    const healthy = makeSocket();
    closeAllViewers([broken, healthy]);
    expect(broken.close).toHaveBeenCalledWith(1000, "host ended");
    expect(healthy.close).toHaveBeenCalledWith(1000, "host ended");
  });
});

describe("isControlFrame", () => {
  it("matches a JSON control frame of the given type", () => {
    expect(isControlFrame(JSON.stringify({ type: "resize", cols: 80, rows: 24 }), "resize")).toBe(true);
    expect(isControlFrame(JSON.stringify({ type: "meta", name: "x" }), "meta")).toBe(true);
  });

  it("rejects a different type, binary data, or unparseable text", () => {
    expect(isControlFrame(JSON.stringify({ type: "ended" }), "resize")).toBe(false);
    expect(isControlFrame(new ArrayBuffer(4), "resize")).toBe(false);
    expect(isControlFrame("not json", "resize")).toBe(false);
  });

  it("recognizes a replay request from a remounted viewer terminal", () => {
    expect(isControlFrame(JSON.stringify({ type: "replay" }), "replay")).toBe(true);
    expect(isControlFrame(JSON.stringify({ type: "resize", cols: 80, rows: 24 }), "replay")).toBe(false);
  });
});

describe("buildJoinFrames", () => {
  const backfill: FrameEntry[] = [{ binary: false, data: "hello", size: 5 }];

  it("sends the last resize frame before backfill when no meta frame is stored", () => {
    const resize = JSON.stringify({ type: "resize", cols: 120, rows: 40 });
    expect(buildJoinFrames(null, resize, backfill)).toEqual([resize, ...backfill]);
  });

  it("leads with meta then resize, both ahead of backfill", () => {
    const meta = JSON.stringify({ type: "meta", name: "Devansh's Claude Code" });
    const resize = JSON.stringify({ type: "resize", cols: 120, rows: 40 });
    expect(buildJoinFrames(meta, resize, backfill)).toEqual([meta, resize, ...backfill]);
  });

  it("falls back to backfill alone when neither control frame is stored", () => {
    expect(buildJoinFrames(null, null, backfill)).toEqual(backfill);
  });

  it("ends the burst with the ended frame for an already-ended room, on both a first join and a replay", () => {
    const meta = JSON.stringify({ type: "meta", name: "Devansh's Claude Code" });
    const resize = JSON.stringify({ type: "resize", cols: 120, rows: 40 });
    expect(buildJoinFrames(meta, resize, backfill, true)).toEqual([meta, resize, ...backfill, ENDED_FRAME]);
  });
});

describe("createRateLimiter", () => {
  it("allows up to the limit within the window, then blocks", () => {
    const limiter = createRateLimiter(5, 10 * 60 * 1000);
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) expect(limiter.attempt("1.2.3.4", now)).toBe(true);
    expect(limiter.attempt("1.2.3.4", now)).toBe(false);
  });

  it("tracks each key independently", () => {
    const limiter = createRateLimiter(1, 1000);
    expect(limiter.attempt("a", 0)).toBe(true);
    expect(limiter.attempt("b", 0)).toBe(true);
    expect(limiter.attempt("a", 0)).toBe(false);
  });

  it("allows again once the window has passed", () => {
    const limiter = createRateLimiter(1, 1000);
    expect(limiter.attempt("a", 0)).toBe(true);
    expect(limiter.attempt("a", 500)).toBe(false);
    expect(limiter.attempt("a", 1500)).toBe(true);
  });
});

describe("corsHeaders", () => {
  it("allows every origin when configured as wildcard", () => {
    expect(corsHeaders("https://sesh.dev", "*")["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("echoes the request origin only when it matches a single-origin allowlist", () => {
    expect(corsHeaders("https://sesh.dev", "https://sesh.dev")["Access-Control-Allow-Origin"]).toBe("https://sesh.dev");
    expect(corsHeaders("https://evil.dev", "https://sesh.dev")).toEqual({});
  });

  it("echoes whichever of two comma-separated origins made the request, and drops CORS headers for a third", () => {
    const allowlist = "https://sesh.dev,https://viewer.sesh.dev";
    expect(corsHeaders("https://sesh.dev", allowlist)["Access-Control-Allow-Origin"]).toBe("https://sesh.dev");
    expect(corsHeaders("https://viewer.sesh.dev", allowlist)["Access-Control-Allow-Origin"]).toBe("https://viewer.sesh.dev");
    expect(corsHeaders("https://evil.dev", allowlist)).toEqual({});
  });
});
