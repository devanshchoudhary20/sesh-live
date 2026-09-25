export interface XTermLike {
  write(data: Uint8Array): void
  resize(cols: number, rows: number): void
}

type QueuedOp = { kind: "write"; data: Uint8Array } | { kind: "resize"; cols: number; rows: number }

const apply = (instance: XTermLike, op: QueuedOp) => {
  if (op.kind === "write") instance.write(op.data)
  else instance.resize(op.cols, op.rows)
}

// The queue is never drained: StrictMode can attach, flush, then detach and dispose an instance before the surviving one attaches, so every attach must be able to replay full history, not just what's arrived since the last flush.
export function createTerminalController() {
  let term: XTermLike | null = null
  const queue: QueuedOp[] = []

  return {
    attach(instance: XTermLike) {
      term = instance
      for (const op of queue) apply(instance, op)
    },
    detach() {
      term = null
    },
    write(data: Uint8Array) {
      queue.push({ kind: "write", data })
      if (term) term.write(data)
    },
    resize(cols: number, rows: number) {
      queue.push({ kind: "resize", cols, rows })
      if (term) term.resize(cols, rows)
    },
  }
}

export type TerminalController = ReturnType<typeof createTerminalController>
