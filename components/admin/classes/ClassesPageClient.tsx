"use client"

import { useMemo, useState } from "react"
import { School, Plus, LayoutGrid, List, Users, Gauge, AlertTriangle } from "lucide-react"
import { PageHero, heroAccentBtn, heroGlassBtn, type HeroKpi } from "@/components/shared/PageHero"
import { useAdminSummary } from "@/lib/hooks/useDashboard"
import { ClassesTable } from "./ClassesTable"
import { ClassesTreeView } from "./ClassesTreeView"
import { ClassCreateModal } from "./ClassCreateModal"

export function ClassesPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "tree">("tree")

  const { data } = useAdminSummary()
  const kpis: HeroKpi[] = useMemo(() => {
    const c = data?.classes
    const rate = c && c.capacity > 0 ? Math.round((c.enrolled / c.capacity) * 100) : 0
    return [
      { label: "Classes", value: c?.total ?? 0, icon: School },
      { label: "Élèves inscrits", value: c?.enrolled ?? 0, icon: Users },
      { label: "Taux d'occupation", value: `${rate}%`, icon: Gauge },
      { label: "Classes pleines", value: c?.full ?? 0, icon: AlertTriangle },
    ]
  }, [data])

  return (
    <div className="space-y-6">
      <PageHero
        icon={School}
        title="Classes"
        subtitle="Gestion des classes par niveau et série"
        actions={
          <>
            {/* View toggle : caché sur mobile (l'arbre n'est pas lisible sur 320px,
                ClassesTable apporte automatiquement sa version mobile cards). */}
            <div role="group" aria-label="Changer la vue" className="hidden md:flex items-center gap-1">
              <button
                type="button"
                className={`${heroGlassBtn} ${viewMode === "tree" ? "" : "opacity-70"}`}
                aria-pressed={viewMode === "tree"}
                onClick={() => setViewMode("tree")}
              >
                <LayoutGrid aria-hidden="true" className="h-4 w-4" />
                Arbre
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
              Nouvelle classe
            </button>
          </>
        }
        kpis={kpis}
      />

      {/* Content : mobile force toujours table (qui contient cards mobile),
          desktop respecte le choix utilisateur (arbre par défaut). */}
      <div className="md:hidden">
        <ClassesTable />
      </div>
      <div className="hidden md:block">
        {viewMode === "tree" ? <ClassesTreeView /> : <ClassesTable />}
      </div>

      <ClassCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
