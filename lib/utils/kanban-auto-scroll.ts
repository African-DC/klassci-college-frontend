export const EDGE_ZONE_PX = 64
export const MIN_SCROLL_PX = 8
export const MAX_SCROLL_PX = 28

export interface ScrollRect {
  left: number
  right: number
  top: number
  bottom: number
}

export interface KanbanScrollInput {
  pointerX: number
  pointerY: number
  viewportWidth: number
  leftBoundaryX: number
  listRect: ScrollRect | null
}

function speedFromInnerEdge(distanceFromInner: number): number {
  const t = Math.min(Math.max(distanceFromInner, 0) / EDGE_ZONE_PX, 1)
  return MIN_SCROLL_PX + t * (MAX_SCROLL_PX - MIN_SCROLL_PX)
}

export function computeHorizontalDelta(
  pointerX: number,
  viewportWidth: number,
  leftBoundaryX: number,
): number {
  const rightInner = viewportWidth - EDGE_ZONE_PX
  if (pointerX >= rightInner) {
    return speedFromInnerEdge(pointerX - rightInner)
  }

  const leftInner = leftBoundaryX + EDGE_ZONE_PX
  if (pointerX >= leftBoundaryX && pointerX <= leftInner) {
    return -speedFromInnerEdge(leftInner - pointerX)
  }

  return 0
}

export function computeVerticalDelta(
  pointerX: number,
  pointerY: number,
  listRect: ScrollRect | null,
): number {
  if (!listRect) return 0
  if (pointerX < listRect.left || pointerX > listRect.right) return 0
  if (pointerY < listRect.top || pointerY > listRect.bottom) return 0

  const topInner = listRect.top + EDGE_ZONE_PX
  const bottomInner = listRect.bottom - EDGE_ZONE_PX
  const inTop = pointerY <= topInner
  const inBottom = pointerY >= bottomInner

  const topSpeed = inTop ? speedFromInnerEdge(topInner - pointerY) : 0
  const bottomSpeed = inBottom ? speedFromInnerEdge(pointerY - bottomInner) : 0

  if (topSpeed >= bottomSpeed) return topSpeed ? -topSpeed : 0
  return bottomSpeed
}

export function computeKanbanScrollDeltas(input: KanbanScrollInput): { x: number; y: number } {
  return {
    x: computeHorizontalDelta(input.pointerX, input.viewportWidth, input.leftBoundaryX),
    y: computeVerticalDelta(input.pointerX, input.pointerY, input.listRect),
  }
}
