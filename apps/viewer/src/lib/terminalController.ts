export interface XTermLike {
  write(data: Uint8Array): void
  resize(cols: number, rows: number): void
}

type QueuedOp = { kind: "write"; data: Uint8Array } | { kind: "resize"; cols: number; rows: number }

// A late joiner's join-frame burst can reach the app before xterm exists; queueing here, outside React's effect timing, means mount() always replays it in call order instead of dropping it.
export function createTerminalController() {
  let term: XTermLike | null = null
  let queue: QueuedOp[] = []

  const flush = () => {
    if (!term) return
    for (const op of queue) {
      if (op.kind === "write") term.write(op.data)
      else term.resize(op.cols, op.rows)
    }
    queue = []
  }

  return {
    mount(instance: XTermLike) {
      term = instance
      flush()
    },
    unmount() {
      term = null
    },
    write(data: Uint8Array) {
      if (term) term.write(data)
      else queue.push({ kind: "write", data })
    },
    resize(cols: number, rows: number) {
      if (term) term.resize(cols, rows)
      else queue.push({ kind: "resize", cols, rows })
    },
  }
}

export type TerminalController = ReturnType<typeof createTerminalController>
