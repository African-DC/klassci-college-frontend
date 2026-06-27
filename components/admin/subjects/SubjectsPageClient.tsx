"use client"

import { useMemo, useState } from "react"
import { BookMarked, Plus, LayoutGrid, List, Layers, UserX, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KpiStrip, type KpiItem } from "@/components/shared/list/KpiStrip"
import { useAdminSummary } from "@/lib/hooks/useDashboard"
import { SubjectsTable } from "./SubjectsTable"
import { SubjectsKanbanView } from "./SubjectsKanbanView"
import { SubjectCreateModal } from "./SubjectCreateModal"

function SubjectsKpis() {
  const { data } = useAdminSummary()
  const kpis: KpiItem[] = useMemo(() => {
    const s = data?.subjects
    const withoutTeacher = s?.without_teacher ?? 0
    return [
      { label: "Matières uniques", value: s?.unique_names ?? 0, icon: BookMarked, tone: "primary" },
      { label: "Instances par niveau", value: s?.instances ?? 0, icon: Layers, tone: "default" },
      { label: "Sans enseignant", value: withoutTeacher, icon: UserX, tone: withoutTeacher > 0 ? "accent" : "default" },
      { label: "Heures / semaine", value: `${s?.total_hours ?? 0}h`, icon: Clock, tone: "default" },
    ]
  }, [data])
  return <KpiStrip items={kpis} />
}

export function SubjectsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookMarked aria-hidden="true" className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Matières</h1>
            <p className="text-sm text-muted-foreground">Gestion des matières par niveau</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Kanban inadapté sous 320px (drag-drop entre colonnes impossible) :
              toggle visible uniquement desktop, mobile force la vue table. */}
          <div
            role="group"
            aria-label="Changer la vue"
            className="hidden md:flex items-center rounded-lg border p-1"
          >
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              aria-pressed={viewMode === "kanban"}
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid aria-hidden="true" className="mr-1.5 h-4 w-4" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              aria-pressed={viewMode === "table"}
              onClick={() => setViewMode("table")}
            >
              <List aria-hidden="true" className="mr-1.5 h-4 w-4" />
              Table
            </Button>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="h-11 sm:h-10">
            <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
            Nouvelle matière
          </Button>
        </div>
      </div>

      <SubjectsKpis />

      {/* Mobile : toujours table. Desktop : respecte le choix utilisateur. */}
      <div className="md:hidden">
        <SubjectsTable />
      </div>
      <div className="hidden md:block">
        {viewMode === "kanban" ? <SubjectsKanbanView /> : <SubjectsTable />}
      </div>

      <SubjectCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
