import { describe, expect, it } from "vitest"
import { extractDemoRoomId } from "./demoRoom"

describe("extractDemoRoomId", () => {
  it("reads the room id from the hash, ignoring a name query string", () => {
    expect(extractDemoRoomId("http://127.0.0.1:5174/?name=Devansh#demo-room-0001")).toBe("demo-room-0001")
  })

  it("reads the room id from a bare hash link", () => {
    expect(extractDemoRoomId("http://127.0.0.1:5174/#demo-room-0001")).toBe("demo-room-0001")
  })

  it("returns null for an empty string", () => {
    expect(extractDemoRoomId("")).toBeNull()
  })

  it("returns null when the URL has no hash", () => {
    expect(extractDemoRoomId("http://127.0.0.1:5174/")).toBeNull()
  })

  it("returns null for an unparseable URL", () => {
    expect(extractDemoRoomId("not a url")).toBeNull()
  })
})
