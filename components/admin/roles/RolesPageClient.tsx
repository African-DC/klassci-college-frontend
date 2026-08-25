"use client"

import { useState } from "react"
import { Plus, Shield } from "lucide-react"
import { PageHero, heroAccentBtn } from "@/components/shared/PageHero"
import { RolesTable } from "./RolesTable"
import { RoleCreateModal } from "./RoleCreateModal"

export function RolesPageClient() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHero
        icon={Shield}
        title="Rôles & Permissions"
        subtitle="Gérez les rôles et leurs permissions d'accès"
        actions={
          <button type="button" className={heroAccentBtn} onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nouveau rôle
          </button>
        }
      />

      <RolesTable />

      <RoleCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
