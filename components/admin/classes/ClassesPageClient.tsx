"use client"

import { useMemo, useState } from "react"
import { School, Plus, LayoutGrid, List, Users, Gauge, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KpiStrip, type KpiItem } from "@/components/shared/list/KpiStrip"
import { useAdminSummary } from "@/lib/hooks/useDashboard"
import { ClassesTable } from "./ClassesTable"
import { ClassesTreeView } from "./ClassesTreeView"
import { ClassCreateModal } from "./ClassCreateModal"

function ClassesKpis() {
  const { data } = useAdminSummary()
  const kpis: KpiItem[] = useMemo(() => {
    const c = data?.classes
    const rate = c && c.capacity > 0 ? Math.round((c.enrolled / c.capacity) * 100) : 0
    return [
      { label: "Classes", value: c?.total ?? 0, icon: School, tone: "primary" },
      { label: "Élèves inscrits", value: c?.enrolled ?? 0, icon: Users, tone: "emerald" },
      { label: "Taux d'occupation", value: `${rate}%`, icon: Gauge, tone: "accent" },
      { label: "Classes pleines", value: c?.full ?? 0, icon: AlertTriangle, tone: (c?.full ?? 0) > 0 ? "destructive" : "default" },
    ]
  }, [data])
  return <KpiStrip items={kpis} />
}

export function ClassesPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "tree">("tree")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <School aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Classes</h1>
            <p className="text-sm text-muted-foreground">Gestion des classes par niveau et série</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle : caché sur mobile (l'arbre n'est pas lisible sur 320px,
              ClassesTable apporte automatiquement sa version mobile cards). */}
          <div
            role="group"
            aria-label="Changer la vue"
            className="hidden md:flex items-center rounded-lg border p-1"
          >
            <Button
              variant={viewMode === "tree" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              aria-pressed={viewMode === "tree"}
              onClick={() => setViewMode("tree")}
            >
              <LayoutGrid aria-hidden="true" className="mr-1.5 h-4 w-4" />
              Arbre
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
          <Button onClick={() => setCreateOpen(true)} className="h-11 gap-2 sm:h-10">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nouvelle classe
          </Button>
        </div>
      </div>

      <ClassesKpis />

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
