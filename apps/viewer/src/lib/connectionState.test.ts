import { describe, expect, it } from "vitest"
import { reduceConnectionState, type ConnectionState, type SocketEvent } from "./connectionState"

function run(initial: ConnectionState, events: SocketEvent[]): ConnectionState {
  return events.reduce(reduceConnectionState, initial)
}

describe("reduceConnectionState", () => {
  it("an invalid control frame then a close stays invalid, not ended", () => {
    const events: SocketEvent[] = [{ type: "control-frame", frame: "invalid" }, { type: "close", code: 4404 }]
    expect(run("connecting", events)).toBe("invalid")
  })

  it("open, then an ended frame, then a close stays ended", () => {
    const events: SocketEvent[] = [
      { type: "open" },
      { type: "control-frame", frame: "ended" },
      { type: "close", code: 1000 },
    ]
    expect(run("connecting", events)).toBe("ended")
  })

  it("a close code 1006 with no frames ever received becomes connection-error", () => {
    const events: SocketEvent[] = [{ type: "close", code: 1006 }]
    expect(run("connecting", events)).toBe("connection-error")
  })

  it("a close after live with no explicit ended frame still becomes ended", () => {
    const events: SocketEvent[] = [{ type: "open" }, { type: "close", code: 1006 }]
    expect(run("connecting", events)).toBe("ended")
  })

  it("terminal states never move on a later close of any code", () => {
    expect(run("invalid", [{ type: "close", code: 1000 }])).toBe("invalid")
    expect(run("ended", [{ type: "close", code: 4404 }])).toBe("ended")
    expect(run("connection-error", [{ type: "close", code: 4404 }])).toBe("connection-error")
  })
})
