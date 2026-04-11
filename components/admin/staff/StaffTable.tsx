"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useStaffList, useDeleteStaff } from "@/lib/hooks/useStaff"
import type { Staff } from "@/lib/contracts/staff"
import { CrudTable } from "@/components/shared/CrudTable"
import { StaffEditModal } from "./StaffEditModal"
import { StaffViewModal } from "./StaffViewModal"

export function StaffTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useStaffList({ page })
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
      accessorKey: "phone",
      header: "Téléphone",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.phone ?? "—"}</span>
      ),
    },
    {
      accessorKey: "position",
      header: "Poste",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.position ?? "—"}</span>
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
      renderViewModal={({ itemId, open, onClose }) => (
        <StaffViewModal staffId={itemId} open={open} onClose={onClose} />
      )}
      renderEditModal={({ itemId, open, onClose }) => (
        <StaffEditModal staffId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(s) => `${s.last_name} ${s.first_name}`}
      emptyMessage="Aucun personnel trouvé"
      errorMessage="Impossible de charger le personnel"
      deleteDescription="Cette action est irréversible. Le membre du personnel sera définitivement supprimé."
      page={page}
      onPageChange={setPage}
    />
  )
}
