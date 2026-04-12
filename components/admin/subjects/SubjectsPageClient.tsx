"use client"

import { useState } from "react"
import { BookMarked, Plus, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SubjectsTable } from "./SubjectsTable"
import { SubjectsKanbanView } from "./SubjectsKanbanView"
import { SubjectCreateModal } from "./SubjectCreateModal"

export function SubjectsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookMarked className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Matières</h1>
            <p className="text-sm text-muted-foreground">Gestion des matières par niveau</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="mr-1.5 h-4 w-4" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode("table")}
            >
              <List className="mr-1.5 h-4 w-4" />
              Table
            </Button>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle matière
          </Button>
        </div>
      </div>

      {viewMode === "kanban" ? <SubjectsKanbanView /> : <SubjectsTable />}

      <SubjectCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
