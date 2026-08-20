"use client"

import type { DragEvent } from "react"
import { BookMarked } from "lucide-react"
import type { Subject } from "@/lib/contracts/subject"
import { Badge } from "@/components/ui/badge"
import { SubjectKanbanCard } from "./SubjectKanbanCard"

interface CatalogueActions {
  onEdit: (id: number) => void
  onDelete: (id: number, name: string) => void
  onDragStart: (event: DragEvent) => void
  onDragEnd: () => void
}

interface Props {
  catalogue: Subject[]
  emptyLabel: string
  actions: CatalogueActions
}

export function SubjectCatalogueColumn({ catalogue, emptyLabel, actions }: Props) {
  return (
    <div className="w-72 shrink-0 rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <BookMarked className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Catalogue</span>
          <Badge variant="secondary" className="text-xs">{catalogue.length}</Badge>
        </div>
      </div>
      <div data-kanban-scroll className="max-h-[calc(100vh-300px)] space-y-2 overflow-y-auto p-2">
        {catalogue.length === 0 ? (
          <div className="py-8 text-center text-xs italic text-muted-foreground">{emptyLabel}</div>
        ) : (
          catalogue.map((subject) => (
            <SubjectKanbanCard
              key={subject.id}
              subject={subject}
              isDraggable
              isCatalogue
              actions={{
                onEdit: () => actions.onEdit(subject.id),
                onDelete: () => actions.onDelete(subject.id, subject.name),
                onDragStart: actions.onDragStart,
                onDragEnd: actions.onDragEnd,
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}