"use client"

import type { DragEvent } from "react"
import { Award, Clock, GripVertical, Pencil, Trash2 } from "lucide-react"
import type { Subject } from "@/lib/contracts/subject"
import { getSubjectColor } from "@/lib/utils/subject-colors"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CardActions {
  onEdit: () => void
  onDelete: () => void
  onDragStart?: (event: DragEvent) => void
  onDragEnd?: () => void
}

interface Props {
  subject: Subject
  isDraggable?: boolean
  isCatalogue?: boolean
  actions: CardActions
}

export function SubjectKanbanCard({ subject, isDraggable, isCatalogue, actions }: Props) {
  const color = getSubjectColor(subject.color)

  return (
    <div
      className={`group rounded-lg border p-3 transition-all hover:shadow-md ${color.bg} ${color.border} ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      draggable={isDraggable}
      onDragStart={isDraggable ? (e) => {
        e.dataTransfer.setData("subjectId", String(subject.id))
        e.dataTransfer.effectAllowed = "copy"
        actions.onDragStart?.(e)
      } : undefined}
      onDragEnd={isDraggable ? actions.onDragEnd : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          {isDraggable && <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />}
          <h4 className={`text-sm font-semibold leading-tight ${color.text}`}>
            {subject.name}
          </h4>
        </div>
        {!isCatalogue && (
          <div className={`ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${color.badge}`}>
            {subject.coefficient}
          </div>
        )}
        {isCatalogue && (
          <div className={`ml-2 h-3 w-3 shrink-0 rounded-full ${color.badge}`} />
        )}
      </div>

      {!isCatalogue && (
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{subject.hours_per_week}h/sem</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-3 w-3" />
            <span>Coef. {subject.coefficient}</span>
          </div>
        </div>
      )}
      {!isCatalogue && subject.teacher_name && (
        <p className="mt-1 truncate text-[10px] text-muted-foreground">
          Prof. {subject.teacher_name}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between">
        {subject.series_name ? (
          <Badge variant="outline" className="text-[10px]">Série {subject.series_name}</Badge>
        ) : <span />}
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={actions.onEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={actions.onDelete}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  )
}