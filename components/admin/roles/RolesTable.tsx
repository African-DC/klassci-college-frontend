"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ShieldCheck } from "lucide-react"
import { useInfiniteRoles, useDeleteRole } from "@/lib/hooks/useRoles"
import type { Role, Permission } from "@/lib/contracts/role"
import { Badge } from "@/components/ui/badge"
import { CrudTable } from "@/components/shared/CrudTable"
import { RoleEditModal } from "./RoleEditModal"

// Labels FR pour les groupes de permissions (préfixe de slug avant ":")
const PERMISSION_GROUP_LABELS: Record<string, string> = {
  students: "Élèves",
  teachers: "Enseignants",
  staff: "Personnel",
  parents: "Parents",
  classes: "Classes",
  rooms: "Salles",
  subjects: "Matières",
  enrollments: "Inscriptions",
  payments: "Paiements",
  fees: "Frais",
  grades: "Notes",
  attendance: "Présences",
  reports: "Bulletins",
  notifications: "Notifications",
  settings: "Paramètres",
  roles: "Rôles",
  admin: "Administration",
  council: "Conseil",
  promotions: "Promotions",
  timetable: "Emploi du temps",
}

function groupPermissions(permissions: Permission[] | undefined): { label: string; count: number }[] {
  if (!permissions) return []
  const groups = new Map<string, number>()
  for (const p of permissions) {
    const prefix = p.slug.split(":")[0]
    groups.set(prefix, (groups.get(prefix) ?? 0) + 1)
  }
  return Array.from(groups.entries())
    .map(([prefix, count]) => ({ label: PERMISSION_GROUP_LABELS[prefix] ?? prefix, count }))
    .sort((a, b) => b.count - a.count)
}

export function RolesTable() {
  const { data, isLoading, isError, error, refetch, scrollInfini } = useInfiniteRoles({})
  const deleteMutation = useDeleteRole()

  const columns: ColumnDef<Role>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ShieldCheck aria-hidden="true" className="h-4 w-4 text-primary" />
          <span className="font-medium">{row.original.name}</span>
          {row.original.is_system && (
            <Badge variant="outline" className="text-[10px]">Système</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.description ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "permissions",
      header: "Permissions",
      cell: ({ row }) => {
        const groups = groupPermissions(row.original.permissions)
        const count = row.original.permissions?.length ?? 0
        const visible = groups.slice(0, 4)
        const hiddenCount = groups.length - visible.length
        if (count === 0) {
          return <span className="text-xs text-muted-foreground">Aucune permission</span>
        }
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {visible.map((g) => (
              <Badge
                key={g.label}
                variant="secondary"
                className="h-6 gap-1 px-2 text-[11px] font-normal"
              >
                {g.label}
                <span className="font-mono tabular-nums text-muted-foreground">{g.count}</span>
              </Badge>
            ))}
            {hiddenCount > 0 && (
              <Badge variant="outline" className="h-6 px-2 text-[11px] font-normal">
                +{hiddenCount} autres
              </Badge>
            )}
            <span className="ml-1 text-[11px] text-muted-foreground tabular-nums">
              ({count} au total)
            </span>
          </div>
        )
      },
    },
  ], [])

  return (
    <CrudTable<Role>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      deleteMutation={deleteMutation}
      renderEditModal={({ itemId, open, onClose }) => (
        <RoleEditModal roleId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(r) => r.name}
      emptyMessage="Aucun rôle trouvé"
      errorMessage="Impossible de charger les rôles"
      deleteDescription="Cette action est irréversible. Le rôle sera définitivement supprimé."
      scrollInfini={scrollInfini}
    />
  )
}
