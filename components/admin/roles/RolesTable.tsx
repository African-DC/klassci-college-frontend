"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ShieldCheck } from "lucide-react"
import { useRoles, useDeleteRole } from "@/lib/hooks/useRoles"
import type { Role } from "@/lib/contracts/role"
import { Badge } from "@/components/ui/badge"
import { CrudTable } from "@/components/shared/CrudTable"
import { RoleEditModal } from "./RoleEditModal"

export function RolesTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useRoles({ page })
  const deleteMutation = useDeleteRole()

  const columns: ColumnDef<Role>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
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
        const count = row.original.permissions?.length ?? 0
        return (
          <Badge variant="secondary" className="font-mono">
            {count}
          </Badge>
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
      page={page}
      onPageChange={setPage}
    />
  )
}
