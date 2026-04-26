"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useSeriesList, useDeleteSeries } from "@/lib/hooks/useSeries"
import type { Series } from "@/lib/contracts/series"
import { CrudTable } from "@/components/shared/CrudTable"
import { SeriesEditModal } from "./SeriesEditModal"

export function SeriesTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useSeriesList({ page })
  const deleteMutation = useDeleteSeries()

  const columns: ColumnDef<Series>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "level_id",
      header: "Niveau (ID)",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.level_id}</span>
      ),
    },
  ], [])

  return (
    <CrudTable<Series>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      deleteMutation={deleteMutation}
      renderEditModal={({ itemId, open, onClose }) => (
        <SeriesEditModal seriesId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(s) => s.name}
      emptyMessage="Aucune serie trouvee"
      errorMessage="Impossible de charger les series"
      deleteDescription="Cette action est irreversible. La serie sera definitivement supprimee."
      page={page}
      onPageChange={setPage}
    />
  )
}
