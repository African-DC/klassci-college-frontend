import { describe, expect, it } from "vitest"
import {
  EDGE_ZONE_PX,
  MAX_SCROLL_PX,
  MIN_SCROLL_PX,
  computeKanbanScrollDeltas,
} from "./kanban-auto-scroll"

const VIEWPORT = 1000
const LEFT_BOUNDARY = 300
const LIST = { left: 320, right: 520, top: 100, bottom: 500 }

describe("computeKanbanScrollDeltas", () => {
  it("returns no delta at the center of the board", () => {
    expect(
      computeKanbanScrollDeltas({
        pointerX: 600,
        pointerY: 300,
        viewportWidth: VIEWPORT,
        leftBoundaryX: LEFT_BOUNDARY,
        listRect: LIST,
      }),
    ).toEqual({ x: 0, y: 0 })
  })

  it("scrolls right at the window edge and faster when closer to it", () => {
    const inner = computeKanbanScrollDeltas({
      pointerX: VIEWPORT - EDGE_ZONE_PX,
      pointerY: 300,
      viewportWidth: VIEWPORT,
      leftBoundaryX: LEFT_BOUNDARY,
      listRect: null,
    })
    const outer = computeKanbanScrollDeltas({
      pointerX: VIEWPORT,
      pointerY: 300,
      viewportWidth: VIEWPORT,
      leftBoundaryX: LEFT_BOUNDARY,
      listRect: null,
    })

    expect(inner.x).toBe(MIN_SCROLL_PX)
    expect(outer.x).toBe(MAX_SCROLL_PX)
    expect(inner.y).toBe(0)
    expect(outer.y).toBe(0)
  })

  it("scrolls left only at the catalogue / levels frontier", () => {
    const inner = computeKanbanScrollDeltas({
      pointerX: LEFT_BOUNDARY + EDGE_ZONE_PX,
      pointerY: 300,
      viewportWidth: VIEWPORT,
      leftBoundaryX: LEFT_BOUNDARY,
      listRect: null,
    })
    const outer = computeKanbanScrollDeltas({
      pointerX: LEFT_BOUNDARY,
      pointerY: 300,
      viewportWidth: VIEWPORT,
      leftBoundaryX: LEFT_BOUNDARY,
      listRect: null,
    })
    const overCatalogue = computeKanbanScrollDeltas({
      pointerX: LEFT_BOUNDARY - 1,
      pointerY: 300,
      viewportWidth: VIEWPORT,
      leftBoundaryX: LEFT_BOUNDARY,
      listRect: null,
    })

    expect(inner.x).toBe(-MIN_SCROLL_PX)
    expect(outer.x).toBe(-MAX_SCROLL_PX)
    expect(overCatalogue.x).toBe(0)
  })

  it("scrolls a column vertically only when the pointer is in its top or bottom band", () => {
    const top = computeKanbanScrollDeltas({
      pointerX: 400,
      pointerY: LIST.top,
      viewportWidth: VIEWPORT,
      leftBoundaryX: LEFT_BOUNDARY,
      listRect: LIST,
    })
    const bottom = computeKanbanScrollDeltas({
      pointerX: 400,
      pointerY: LIST.bottom,
      viewportWidth: VIEWPORT,
      leftBoundaryX: LEFT_BOUNDARY,
      listRect: LIST,
    })
    const outsideX = computeKanbanScrollDeltas({
      pointerX: LIST.right + 10,
      pointerY: LIST.top,
      viewportWidth: VIEWPORT,
      leftBoundaryX: LEFT_BOUNDARY,
      listRect: LIST,
    })

    expect(top.y).toBe(-MAX_SCROLL_PX)
    expect(bottom.y).toBe(MAX_SCROLL_PX)
    expect(outsideX.y).toBe(0)
  })
})
