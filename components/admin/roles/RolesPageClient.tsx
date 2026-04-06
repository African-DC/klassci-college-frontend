"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RolesTable } from "./RolesTable"
import { RoleCreateModal } from "./RoleCreateModal"

export function RolesPageClient() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Rôles & Permissions</h1>
          <p className="text-sm text-muted-foreground">Gérez les rôles et leurs permissions d&apos;accès</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau rôle
        </Button>
      </div>

      <RolesTable />

      <RoleCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
