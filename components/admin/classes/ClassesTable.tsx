"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useClasses, useDeleteClass } from "@/lib/hooks/useClasses"
import type { Class } from "@/lib/contracts/class"
import { CrudTable } from "@/components/shared/CrudTable"
import { ClassEditModal } from "./ClassEditModal"

export function ClassesTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useClasses({ page })
  const deleteMutation = useDeleteClass()

  const columns: ColumnDef<Class>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "level_id",
      header: "Niveau",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.level_id}</span>
      ),
    },
    {
      accessorKey: "max_students",
      header: "Capacité max",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.max_students ?? "—"}</span>
      ),
    },
  ], [])

  return (
    <CrudTable<Class>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      deleteMutation={deleteMutation}
      renderEditModal={({ itemId, open, onClose }) => (
        <ClassEditModal classId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(c) => c.name}
      emptyMessage="Aucune classe trouvée"
      errorMessage="Impossible de charger les classes"
      deleteDescription="Cette action est irréversible. La classe sera définitivement supprimée."
      page={page}
      onPageChange={setPage}
    />
  )
}
