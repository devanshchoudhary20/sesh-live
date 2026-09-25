import { describe, expect, it } from "vitest"
import { computeTerminalScale } from "./terminalScale"

describe("computeTerminalScale", () => {
  it("shrinks to fit the tighter dimension", () => {
    expect(computeTerminalScale({ width: 800, height: 600 }, { width: 1000, height: 500 })).toBe(0.8)
  })

  it("never upscales past 1 when the container is larger than the natural size", () => {
    expect(computeTerminalScale({ width: 2000, height: 2000 }, { width: 800, height: 400 })).toBe(1)
  })

  it("falls back to 1 for a zero or negative natural size", () => {
    expect(computeTerminalScale({ width: 800, height: 600 }, { width: 0, height: 0 })).toBe(1)
  })
})
