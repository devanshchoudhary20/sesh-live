import { afterEach, describe, expect, it, vi } from "vitest"
import { reduceConnectionState, type ConnectionState, type SocketEvent } from "../lib/connectionState"
import { connectRoomSocket } from "./useRoomSocket"

// Minimal stand-in for the browser WebSocket: only the surface connectRoomSocket touches.
class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  static readonly OPEN = 1
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string | ArrayBuffer }) => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null
  binaryType = ""
  closedWithCode: number | undefined
  sent: string[] = []
  readyState = FakeWebSocket.OPEN
  url: string

  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }

  send(data: string) {
    this.sent.push(data)
  }

  close(code?: number) {
    this.closedWithCode = code
  }
}

const originalWebSocket = globalThis.WebSocket

afterEach(() => {
  globalThis.WebSocket = originalWebSocket
  FakeWebSocket.instances = []
})

describe("connectRoomSocket", () => {
  it("a StrictMode remount's stale socket cannot latch connection-error; the live socket still reaches live", () => {
    // @ts-expect-error fake stands in for the DOM WebSocket in this node test environment
    globalThis.WebSocket = FakeWebSocket

    let state: ConnectionState = "connecting"
    const dispatch = (event: SocketEvent) => {
      state = reduceConnectionState(state, event)
    }
    const onFrame = vi.fn()
    const onResize = vi.fn()
    const onMeta = vi.fn()

    const first = connectRoomSocket("ws://relay/r/room1", { onFrame, onResize, onMeta, dispatch })
    const staleSocket = FakeWebSocket.instances[0]
    const staleOnClose = staleSocket.onclose // capture as if the event were already queued before cleanup runs

    first.disconnect() // StrictMode's synchronous mount -> cleanup

    const second = connectRoomSocket("ws://relay/r/room1", { onFrame, onResize, onMeta, dispatch })
    const liveSocket = FakeWebSocket.instances[1]

    staleOnClose?.({ code: 1006 }) // the phantom socket's belated close
    expect(state).toBe("connecting")

    liveSocket.onopen?.()
    expect(state).toBe("live")

    liveSocket.onmessage?.({ data: new ArrayBuffer(4) })
    expect(onFrame).toHaveBeenCalledTimes(1)
    expect(state).toBe("live")

    second.disconnect()
    expect(liveSocket.closedWithCode).toBe(1000)
  })
})

describe("connectRoomSocket requestReplay", () => {
  it("sends a replay frame only while the socket is open, and never onto a socket that already disconnected", () => {
    // @ts-expect-error fake stands in for the DOM WebSocket in this node test environment
    globalThis.WebSocket = FakeWebSocket

    const dispatch = vi.fn()
    const connection = connectRoomSocket("ws://relay/r/room1", { onFrame: vi.fn(), onResize: vi.fn(), onMeta: vi.fn(), dispatch })
    const socket = FakeWebSocket.instances[0]

    connection.requestReplay()
    expect(socket.sent).toEqual([JSON.stringify({ type: "replay" })])

    socket.readyState = 3 // CLOSED
    connection.requestReplay()
    expect(socket.sent).toHaveLength(1)
  })
})

describe("connectRoomSocket meta frames", () => {
  it("dispatches the host name from a meta control frame", () => {
    // @ts-expect-error fake stands in for the DOM WebSocket in this node test environment
    globalThis.WebSocket = FakeWebSocket

    const dispatch = vi.fn()
    const onFrame = vi.fn()
    const onResize = vi.fn()
    const onMeta = vi.fn()

    connectRoomSocket("ws://relay/r/room1", { onFrame, onResize, onMeta, dispatch })
    const socket = FakeWebSocket.instances[0]

    socket.onmessage?.({ data: JSON.stringify({ type: "meta", name: "Devansh's Claude Code" }) })

    expect(onMeta).toHaveBeenCalledWith("Devansh's Claude Code")
  })
})

