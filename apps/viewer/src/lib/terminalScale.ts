export interface BoxSize {
  width: number
  height: number
}

// Once a host size is known the grid is fixed, so this scales the rendered box to fit instead of re-fitting cols/rows.
export function computeTerminalScale(container: BoxSize, natural: BoxSize): number {
  if (natural.width <= 0 || natural.height <= 0) return 1
  return Math.min(1, container.width / natural.width, container.height / natural.height)
}
