"use client"

import { useCallback, useEffect, useRef, useState, type DragEvent as ReactDragEvent } from "react"
import { computeKanbanScrollDeltas } from "@/lib/utils/kanban-auto-scroll"

function listUnderPointer(x: number, y: number, root: ParentNode | null): HTMLElement | null {
  const lists = (root ?? document).querySelectorAll<HTMLElement>("[data-kanban-scroll]")
  for (const list of lists) {
    const rect = list.getBoundingClientRect()
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return list
    }
  }
  return null
}

export function useKanbanAutoScroll() {
  const boardRef = useRef<HTMLDivElement>(null)
  const catalogueRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const start = useCallback((event?: ReactDragEvent) => {
    if (event) pointerRef.current = { x: event.clientX, y: event.clientY }
    setIsDragging(true)
  }, [])
  const stop = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    if (!isDragging) return

    const onDragOver = (event: DragEvent) => {
      event.preventDefault()
      pointerRef.current = { x: event.clientX, y: event.clientY }
    }
    const onEnd = () => stop()

    document.addEventListener("dragover", onDragOver)
    document.addEventListener("dragend", onEnd)
    window.addEventListener("drop", onEnd)

    let frame = 0
    const loop = () => {
      const board = boardRef.current
      if (board) {
        const list = listUnderPointer(pointerRef.current.x, pointerRef.current.y, board)
        const { x, y } = computeKanbanScrollDeltas({
          pointerX: pointerRef.current.x,
          pointerY: pointerRef.current.y,
          viewportWidth: window.innerWidth,
          leftBoundaryX: catalogueRef.current?.getBoundingClientRect().right ?? 0,
          listRect: list?.getBoundingClientRect() ?? null,
        })
        if (x) board.scrollLeft += x
        if (y && list) list.scrollTop += y
      }
      frame = window.requestAnimationFrame(loop)
    }
    frame = window.requestAnimationFrame(loop)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener("dragover", onDragOver)
      document.removeEventListener("dragend", onEnd)
      window.removeEventListener("drop", onEnd)
    }
  }, [isDragging, stop])

  return { boardRef, catalogueRef, isDragging, start, stop }
}