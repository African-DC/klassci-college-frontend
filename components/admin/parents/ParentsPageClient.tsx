"use client"

import { useState } from "react"
import { HeartHandshake, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useParents } from "@/lib/hooks/useParents"
import { ParentsTable } from "./ParentsTable"
import { ParentCreateModal } from "./ParentCreateModal"

export function ParentsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data } = useParents({ size: 1 })
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <HeartHandshake className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-xl tracking-tight sm:text-2xl">Parents</h1>
            <p className="text-sm text-muted-foreground">
              {total} {total > 1 ? "parents au total" : "parent au total"}
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-11 gap-2 sm:h-10">
          <Plus className="h-4 w-4" />
          Nouveau parent
        </Button>
      </div>
      <ParentsTable />
      <ParentCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
