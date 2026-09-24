import { afterEach, describe, expect, it, vi } from "vitest"
import { reduceConnectionState, type ConnectionState, type SocketEvent } from "../lib/connectionState"
import { connectRoomSocket } from "./useRoomSocket"

// Minimal stand-in for the browser WebSocket: only the surface connectRoomSocket touches.
class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string | ArrayBuffer }) => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null
  binaryType = ""
  closedWithCode: number | undefined
  url: string

  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
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

    const cleanupFirst = connectRoomSocket("ws://relay/r/room1", { onFrame, onResize, dispatch })
    const staleSocket = FakeWebSocket.instances[0]
    const staleOnClose = staleSocket.onclose // capture as if the event were already queued before cleanup runs

    cleanupFirst() // StrictMode's synchronous mount -> cleanup

    const cleanupSecond = connectRoomSocket("ws://relay/r/room1", { onFrame, onResize, dispatch })
    const liveSocket = FakeWebSocket.instances[1]

    staleOnClose?.({ code: 1006 }) // the phantom socket's belated close
    expect(state).toBe("connecting")

    liveSocket.onopen?.()
    expect(state).toBe("live")

    liveSocket.onmessage?.({ data: new ArrayBuffer(4) })
    expect(onFrame).toHaveBeenCalledTimes(1)
    expect(state).toBe("live")

    cleanupSecond()
    expect(liveSocket.closedWithCode).toBe(1000)
  })
})
