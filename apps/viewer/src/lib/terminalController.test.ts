import { describe, expect, it, vi } from "vitest"
import { createTerminalController } from "./terminalController"

// Reproduces a late joiner's join-frame burst arriving before xterm exists; no jsdom needed, xterm is a plain spy object.
describe("createTerminalController", () => {
  it("queues resize and write calls made before attach and does not touch the term instance yet", () => {
    const controller = createTerminalController()
    const backfillBytes = new Uint8Array([1, 2, 3])
    const term = { write: vi.fn(), resize: vi.fn() }

    controller.resize(80, 24)
    controller.write(backfillBytes)

    expect(term.resize).not.toHaveBeenCalled()
    expect(term.write).not.toHaveBeenCalled()
  })

  it("flushes queued calls onto the term in order once attached: resize before the backfill write", () => {
    const controller = createTerminalController()
    const backfillBytes = new Uint8Array([1, 2, 3])
    const term = { write: vi.fn(), resize: vi.fn() }

    controller.resize(80, 24)
    controller.write(backfillBytes)
    controller.attach(term)

    expect(term.resize).toHaveBeenCalledWith(80, 24)
    expect(term.write).toHaveBeenCalledWith(backfillBytes)
    expect(term.resize.mock.invocationCallOrder[0]).toBeLessThan(term.write.mock.invocationCallOrder[0])
  })

  it("calls straight through to the term once already attached", () => {
    const controller = createTerminalController()
    const term = { write: vi.fn(), resize: vi.fn() }
    controller.attach(term)

    controller.resize(100, 30)
    controller.write(new Uint8Array([9]))

    expect(term.resize).toHaveBeenCalledWith(100, 30)
    expect(term.write).toHaveBeenCalledWith(new Uint8Array([9]))
  })

  it("detach stops delivering to the old term and resumes queueing for the next attach", () => {
    const controller = createTerminalController()
    const first = { write: vi.fn(), resize: vi.fn() }
    const second = { write: vi.fn(), resize: vi.fn() }
    controller.attach(first)
    controller.detach()

    controller.write(new Uint8Array([5]))
    expect(first.write).not.toHaveBeenCalled()

    controller.attach(second)
    expect(second.write).toHaveBeenCalledWith(new Uint8Array([5]))
  })

  it("attach A, write, detach A, write more, attach B: B receives all writes in order", () => {
    const controller = createTerminalController()
    const a = { write: vi.fn(), resize: vi.fn() }
    const b = { write: vi.fn(), resize: vi.fn() }

    controller.attach(a)
    controller.write(new Uint8Array([1]))
    controller.detach()
    controller.write(new Uint8Array([2]))
    controller.attach(b)

    expect(a.write).toHaveBeenCalledTimes(1)
    expect(a.write).toHaveBeenCalledWith(new Uint8Array([1]))
    expect(b.write.mock.calls).toEqual([[new Uint8Array([1])], [new Uint8Array([2])]])
  })
})
