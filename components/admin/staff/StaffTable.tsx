"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { useStaffList, useDeleteStaff } from "@/lib/hooks/useStaff"
import type { Staff } from "@/lib/contracts/staff"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CrudTable } from "@/components/shared/CrudTable"
import { StaffEditModal } from "./StaffEditModal"

export function StaffTable() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useStaffList({ page })
  const deleteMutation = useDeleteStaff()

  const columns: ColumnDef<Staff>[] = useMemo(() => [
    {
      accessorKey: "last_name",
      header: "Nom",
      cell: ({ row }) => {
        const s = row.original
        const initials = `${s.first_name?.[0] ?? ""}${s.last_name?.[0] ?? ""}`.toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span>{s.last_name} {s.first_name}</span>
          </div>
        )
      },
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
      onRowClick={(item) => router.push(`/admin/staff/${item.id}`)}
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
