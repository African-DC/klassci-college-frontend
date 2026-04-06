"use client"

import { useMemo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import type { Permission, PermissionModule } from "@/lib/contracts/role"
import { cn } from "@/lib/utils"

/** Labels lisibles pour chaque module */
const MODULE_LABELS: Record<PermissionModule, string> = {
  inscriptions: "Inscriptions",
  notes: "Notes & Évaluations",
  paiements: "Paiements",
  presences: "Présences",
  emploi_du_temps: "Emploi du temps",
  utilisateurs: "Utilisateurs",
  parametres: "Paramètres",
  notifications: "Notifications",
}

interface PermissionMatrixProps {
  permissions: Permission[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

export function PermissionMatrix({ permissions, selectedIds, onChange }: PermissionMatrixProps) {
  /** Groupe les permissions par module */
  const grouped = useMemo(() => {
    const map = new Map<PermissionModule, Permission[]>()
    for (const perm of permissions) {
      const list = map.get(perm.module) ?? []
      list.push(perm)
      map.set(perm.module, list)
    }
    return map
  }, [permissions])

  /** Set pour des lookups O(1) */
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  function togglePermission(id: number) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((pid) => pid !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  function toggleModule(module: PermissionModule) {
    const modulePermIds = grouped.get(module)?.map((p) => p.id) ?? []
    const allSelected = modulePermIds.every((id) => selectedSet.has(id))

    if (allSelected) {
      const removeSet = new Set(modulePermIds)
      onChange(selectedIds.filter((id) => !removeSet.has(id)))
    } else {
      const merged = new Set([...selectedIds, ...modulePermIds])
      onChange(Array.from(merged))
    }
  }

  if (permissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Aucune permission disponible.
      </p>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      {Array.from(grouped.entries()).map(([module, perms]) => {
        const modulePermIds = perms.map((p) => p.id)
        const allChecked = modulePermIds.every((id) => selectedSet.has(id))
        const someChecked = !allChecked && modulePermIds.some((id) => selectedSet.has(id))

        return (
          <div key={module} className="space-y-2">
            {/* En-tête du module */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allChecked ? true : someChecked ? "indeterminate" : false}
                onCheckedChange={() => toggleModule(module)}
              />
              <span className="text-sm font-semibold">
                {MODULE_LABELS[module] ?? module}
              </span>
              <span className="text-xs text-muted-foreground">
                ({modulePermIds.filter((id) => selectedSet.has(id)).length}/{perms.length})
              </span>
            </div>

            {/* Permissions du module */}
            <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {perms.map((perm) => {
                const isChecked = selectedSet.has(perm.id)
                return (
                  <label
                    key={perm.id}
                    className={cn(
                      "flex items-start gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors",
                      isChecked
                        ? "border-primary/30 bg-primary/[0.03]"
                        : "border-transparent hover:bg-muted/50",
                    )}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => togglePermission(perm.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{perm.name}</p>
                      {perm.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{perm.description}</p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
