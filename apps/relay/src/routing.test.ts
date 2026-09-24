import { describe, expect, it } from "vitest";
import {
  appendToRingBuffer,
  base64ToBuffer,
  bufferToBase64,
  corsHeaders,
  isValidEmail,
  parseRoomPath,
  resolveRole,
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

describe("corsHeaders", () => {
  it("allows every origin when configured as wildcard", () => {
    expect(corsHeaders("https://sesh.dev", "*")["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("echoes the request origin only when it matches the allowlist", () => {
    expect(corsHeaders("https://sesh.dev", "https://sesh.dev")["Access-Control-Allow-Origin"]).toBe("https://sesh.dev");
    expect(corsHeaders("https://evil.dev", "https://sesh.dev")["Access-Control-Allow-Origin"]).toBe("");
  });
});
