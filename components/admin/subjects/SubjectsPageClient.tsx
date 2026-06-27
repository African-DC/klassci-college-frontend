"use client"

import { useMemo, useState } from "react"
import { BookMarked, Plus, LayoutGrid, List, Layers, UserX, Clock } from "lucide-react"
import { PageHero, heroAccentBtn, heroGlassBtn, type HeroKpi } from "@/components/shared/PageHero"
import { useAdminSummary } from "@/lib/hooks/useDashboard"
import { SubjectsTable } from "./SubjectsTable"
import { SubjectsKanbanView } from "./SubjectsKanbanView"
import { SubjectCreateModal } from "./SubjectCreateModal"

export function SubjectsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")

  const { data } = useAdminSummary()
  const kpis: HeroKpi[] = useMemo(() => {
    const s = data?.subjects
    return [
      { label: "Matières uniques", value: s?.unique_names ?? 0, icon: BookMarked },
      { label: "Instances par niveau", value: s?.instances ?? 0, icon: Layers },
      { label: "Sans enseignant", value: s?.without_teacher ?? 0, icon: UserX },
      { label: "Heures / semaine", value: `${s?.total_hours ?? 0}h`, icon: Clock },
    ]
  }, [data])

  return (
    <div className="space-y-6">
      <PageHero
        icon={BookMarked}
        title="Matières"
        subtitle="Gestion des matières par niveau"
        actions={
          <>
            {/* Kanban inadapté sous 320px (drag-drop entre colonnes impossible) :
                toggle visible uniquement desktop, mobile force la vue table. */}
            <div role="group" aria-label="Changer la vue" className="hidden md:flex items-center gap-1">
              <button
                type="button"
                className={`${heroGlassBtn} ${viewMode === "kanban" ? "" : "opacity-70"}`}
                aria-pressed={viewMode === "kanban"}
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid aria-hidden="true" className="h-4 w-4" />
                Kanban
              </button>
              <button
                type="button"
                className={`${heroGlassBtn} ${viewMode === "table" ? "" : "opacity-70"}`}
                aria-pressed={viewMode === "table"}
                onClick={() => setViewMode("table")}
              >
                <List aria-hidden="true" className="h-4 w-4" />
                Table
              </button>
            </div>
            <button type="button" className={heroAccentBtn} onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nouvelle matière
            </button>
          </>
        }
        kpis={kpis}
      />

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
