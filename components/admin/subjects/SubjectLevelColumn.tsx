"use client"

import { GraduationCap } from "lucide-react"
import type { Subject } from "@/lib/contracts/subject"
import type { Level } from "@/lib/contracts/level"
import { Badge } from "@/components/ui/badge"
import { SubjectKanbanCard } from "./SubjectKanbanCard"

interface SeriesOption {
  id: number
  name: string
}

interface ColumnActions {
  onDrop: (subjectId: number, levelId: number, levelName: string, seriesId: number | null) => void
  onEdit: (id: number) => void
  onDelete: (id: number, name: string) => void
  setDragOverTarget: (target: string | null) => void
}

interface Props {
  level: Level
  subjects: Subject[]
  series: SeriesOption[]
  dragOverTarget: string | null
  actions: ColumnActions
}

export function SubjectLevelColumn({ level, subjects, series, dragOverTarget, actions }: Props) {
  const totalHours = subjects.reduce((sum, subject) => sum + subject.hours_per_week, 0)
  const key = `level-${level.id}`
  const isDragOver = dragOverTarget === key
  const hasSeries = series.length > 0
  const directSubjects = subjects.filter((subject) => !subject.series_id)

  return (
    <div
      className={`w-72 shrink-0 rounded-lg border transition-colors ${
        isDragOver ? "bg-primary/5 ring-2 ring-primary/40" : "bg-muted/30"
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "copy"
        actions.setDragOverTarget(key)
      }}
      onDragLeave={() => actions.setDragOverTarget(null)}
      onDrop={(e) => {
        e.preventDefault()
        actions.setDragOverTarget(null)
        const subjectId = Number(e.dataTransfer.getData("subjectId"))
        if (subjectId) actions.onDrop(subjectId, level.id, level.name, null)
      }}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{level.name}</span>
          <Badge variant="secondary" className="text-xs">{subjects.length}</Badge>
        </div>
        <span className="text-xs text-muted-foreground">{totalHours}h</span>
      </div>

      <div data-kanban-scroll className="max-h-[calc(100vh-300px)] space-y-1 overflow-y-auto p-2">
        {directSubjects.map((subject) => (
          <SubjectKanbanCard
            key={subject.id}
            subject={subject}
            actions={{
              onEdit: () => actions.onEdit(subject.id),
              onDelete: () => actions.onDelete(subject.id, subject.name),
            }}
          />
        ))}

        {hasSeries && series.map((ser) => {
          const seriesSubjects = subjects.filter((subject) => subject.series_id === ser.id)
          const seriesKey = `series-${ser.id}`
          const isSeriesDragOver = dragOverTarget === seriesKey
          return (
            <div
              key={ser.id}
              className={`mt-1 rounded-md border border-dashed p-1.5 transition-colors ${
                isSeriesDragOver ? "border-accent bg-accent/5" : "border-border/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.dataTransfer.dropEffect = "copy"
                actions.setDragOverTarget(seriesKey)
              }}
              onDragLeave={(e) => {
                e.stopPropagation()
                actions.setDragOverTarget(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                actions.setDragOverTarget(null)
                const subjectId = Number(e.dataTransfer.getData("subjectId"))
                if (subjectId) actions.onDrop(subjectId, level.id, level.name, ser.id)
              }}
            >
              <p className="mb-1 px-1 text-[10px] font-medium text-muted-foreground">
                Série {ser.name}
              </p>
              {seriesSubjects.length === 0 ? (
                <p className="px-1 py-2 text-[10px] italic text-muted-foreground/60">Déposer ici</p>
              ) : (
                seriesSubjects.map((subject) => (
                  <SubjectKanbanCard
                    key={subject.id}
                    subject={subject}
                    actions={{
                      onEdit: () => actions.onEdit(subject.id),
                      onDelete: () => actions.onDelete(subject.id, subject.name),
                    }}
                  />
                ))
              )}
            </div>
          )
        })}

        {subjects.length === 0 && !hasSeries && (
          <div className="py-8 text-center text-xs italic text-muted-foreground">
            Déposer une matière ici
          </div>
        )}
      </div>
    </div>
  )
}
