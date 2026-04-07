"use client"

import { useMemo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import type { Permission } from "@/lib/contracts/role"
import { cn } from "@/lib/utils"

/** Derive a grouping key from the permission slug (e.g. "inscriptions.create" -> "inscriptions") */
function getGroupKey(slug: string): string {
  const dotIndex = slug.indexOf(".")
  return dotIndex > 0 ? slug.substring(0, dotIndex) : slug
}

/** Labels lisibles pour les groupes de permissions */
const GROUP_LABELS: Record<string, string> = {
  inscriptions: "Inscriptions",
  notes: "Notes & Evaluations",
  paiements: "Paiements",
  presences: "Presences",
  emploi_du_temps: "Emploi du temps",
  utilisateurs: "Utilisateurs",
  parametres: "Parametres",
  notifications: "Notifications",
}

interface PermissionMatrixProps {
  permissions: Permission[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

export function PermissionMatrix({ permissions, selectedIds, onChange }: PermissionMatrixProps) {
  /** Groupe les permissions par prefixe du slug */
  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>()
    for (const perm of permissions) {
      const group = getGroupKey(perm.slug)
      const list = map.get(group) ?? []
      list.push(perm)
      map.set(group, list)
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

  function toggleGroup(group: string) {
    const groupPermIds = grouped.get(group)?.map((p) => p.id) ?? []
    const allSelected = groupPermIds.every((id) => selectedSet.has(id))

    if (allSelected) {
      const removeSet = new Set(groupPermIds)
      onChange(selectedIds.filter((id) => !removeSet.has(id)))
    } else {
      const merged = new Set([...selectedIds, ...groupPermIds])
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
      {Array.from(grouped.entries()).map(([group, perms]) => {
        const groupPermIds = perms.map((p) => p.id)
        const allChecked = groupPermIds.every((id) => selectedSet.has(id))
        const someChecked = !allChecked && groupPermIds.some((id) => selectedSet.has(id))

        return (
          <div key={group} className="space-y-2">
            {/* En-tete du groupe */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allChecked ? true : someChecked ? "indeterminate" : false}
                onCheckedChange={() => toggleGroup(group)}
              />
              <span className="text-sm font-semibold">
                {GROUP_LABELS[group] ?? group}
              </span>
              <span className="text-xs text-muted-foreground">
                ({groupPermIds.filter((id) => selectedSet.has(id)).length}/{perms.length})
              </span>
            </div>

            {/* Permissions du groupe */}
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
