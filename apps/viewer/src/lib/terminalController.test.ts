import { describe, expect, it, vi } from "vitest"
import { createTerminalController } from "./terminalController"

// Reproduces a late joiner's join-frame burst arriving before xterm exists; no jsdom needed, xterm is a plain spy object.
describe("createTerminalController", () => {
  it("queues resize and write calls made before mount and does not touch the term instance yet", () => {
    const controller = createTerminalController()
    const backfillBytes = new Uint8Array([1, 2, 3])
    const term = { write: vi.fn(), resize: vi.fn() }

    controller.resize(80, 24)
    controller.write(backfillBytes)

    expect(term.resize).not.toHaveBeenCalled()
    expect(term.write).not.toHaveBeenCalled()
  })

  it("flushes queued calls onto the term in order once mounted: resize before the backfill write", () => {
    const controller = createTerminalController()
    const backfillBytes = new Uint8Array([1, 2, 3])
    const term = { write: vi.fn(), resize: vi.fn() }

    controller.resize(80, 24)
    controller.write(backfillBytes)
    controller.mount(term)

    expect(term.resize).toHaveBeenCalledWith(80, 24)
    expect(term.write).toHaveBeenCalledWith(backfillBytes)
    expect(term.resize.mock.invocationCallOrder[0]).toBeLessThan(term.write.mock.invocationCallOrder[0])
  })

  it("calls straight through to the term once already mounted, with no queueing", () => {
    const controller = createTerminalController()
    const term = { write: vi.fn(), resize: vi.fn() }
    controller.mount(term)

    controller.resize(100, 30)
    controller.write(new Uint8Array([9]))

    expect(term.resize).toHaveBeenCalledWith(100, 30)
    expect(term.write).toHaveBeenCalledWith(new Uint8Array([9]))
  })

  it("unmount stops delivering to the old term and resumes queueing for the next mount", () => {
    const controller = createTerminalController()
    const first = { write: vi.fn(), resize: vi.fn() }
    const second = { write: vi.fn(), resize: vi.fn() }
    controller.mount(first)
    controller.unmount()

    controller.write(new Uint8Array([5]))
    expect(first.write).not.toHaveBeenCalled()

    controller.mount(second)
    expect(second.write).toHaveBeenCalledWith(new Uint8Array([5]))
  })
})
