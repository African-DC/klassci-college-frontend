"use client"

import { useState } from "react"
import { School, Plus, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClassesTable } from "./ClassesTable"
import { ClassesTreeView } from "./ClassesTreeView"
import { ClassCreateModal } from "./ClassCreateModal"

export function ClassesPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "tree">("tree")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <School className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Classes</h1>
            <p className="text-sm text-muted-foreground">Gestion des classes par niveau et série</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={viewMode === "tree" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode("tree")}
            >
              <LayoutGrid className="mr-1.5 h-4 w-4" />
              Arbre
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
          <Button onClick={() => setCreateOpen(true)} className="h-11 gap-2 sm:h-10">
            <Plus className="h-4 w-4" />
            Nouvelle classe
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "tree" ? <ClassesTreeView /> : <ClassesTable />}

      <ClassCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
