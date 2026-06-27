"use client"

import { useState } from "react"
import { Plus, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RolesTable } from "./RolesTable"
import { RoleCreateModal } from "./RoleCreateModal"

export function RolesPageClient() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Shield aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl tracking-tight">Rôles &amp; Permissions</h1>
            <p className="text-sm text-muted-foreground">Gérez les rôles et leurs permissions d&apos;accès</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-11 gap-2 sm:h-10">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Nouveau rôle
        </Button>
      </div>

      <RolesTable />

      <RoleCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
