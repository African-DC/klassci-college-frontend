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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <School className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
            <p className="text-sm text-muted-foreground">Gestion des classes par niveau et série</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
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
