"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useStaffList, useDeleteStaff } from "@/lib/hooks/useStaff"
import type { Staff } from "@/lib/contracts/staff"
import { Badge } from "@/components/ui/badge"
import { CrudTable } from "@/components/shared/CrudTable"
import { StaffEditModal } from "./StaffEditModal"

export function StaffTable() {
  const { data, isLoading, isError, error, refetch } = useStaffList()
  const deleteMutation = useDeleteStaff()

  const columns: ColumnDef<Staff>[] = useMemo(() => [
    {
      accessorKey: "last_name",
      header: "Nom",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.last_name} {row.original.first_name}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.email ?? "—"}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Téléphone",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.phone ?? "—"}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Poste",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.role ?? "—"}</span>
      ),
    },
    {
      accessorKey: "department",
      header: "Département",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.department ?? "—"}
        </Badge>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Statut",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active !== false ? "default" : "secondary"}>
          {row.original.is_active !== false ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
  ], [])

  return (
    <CrudTable<Staff>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      deleteMutation={deleteMutation}
      renderEditModal={({ itemId, open, onClose }) => (
        <StaffEditModal staffId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(s) => `${s.last_name} ${s.first_name}`}
      emptyMessage="Aucun personnel trouvé"
      errorMessage="Impossible de charger le personnel"
      deleteDescription="Cette action est irréversible. Le membre du personnel sera définitivement supprimé."
    />
  )
}
