"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useLevels, useDeleteLevel } from "@/lib/hooks/useLevels"
import type { Level } from "@/lib/contracts/level"
import { CrudTable } from "@/components/shared/CrudTable"
import { LevelEditModal } from "./LevelEditModal"

export function LevelsTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useLevels({ page })
  const deleteMutation = useDeleteLevel()

  const columns: ColumnDef<Level>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "order",
      header: "Ordre",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.order}</span>
      ),
    },
  ], [])

  return (
    <CrudTable<Level>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      deleteMutation={deleteMutation}
      renderEditModal={({ itemId, open, onClose }) => (
        <LevelEditModal levelId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(l) => l.name}
      emptyMessage="Aucun niveau trouve"
      errorMessage="Impossible de charger les niveaux"
      deleteDescription="Cette action est irreversible. Le niveau sera definitivement supprime."
      page={page}
      onPageChange={setPage}
    />
  )
}
