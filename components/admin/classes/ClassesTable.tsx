"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useClasses, useDeleteClass } from "@/lib/hooks/useClasses"
import type { Class } from "@/lib/contracts/class"
import { CrudTable } from "@/components/shared/CrudTable"
import { ClassEditModal } from "./ClassEditModal"

function EnrolledCell({ enrolled, max }: { enrolled?: number; max?: number | null }) {
  const count = enrolled ?? 0
  const capacity = max ?? 0
  const ratio = capacity > 0 ? (count / capacity) * 100 : 0

  const barColor =
    ratio > 95
      ? "bg-rose-500"
      : ratio >= 80
        ? "bg-amber-500"
        : "bg-emerald-500"

  return (
    <div className="flex items-center gap-3 min-w-[120px]">
      <span className="text-sm font-mono whitespace-nowrap">
        {count} / {capacity || "—"}
      </span>
      {capacity > 0 && (
        <div className="flex-1 h-2 rounded-full bg-muted max-w-[80px]">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(ratio, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

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
      accessorKey: "level_name",
      header: "Niveau",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.level_name ?? row.original.level_id}
        </span>
      ),
    },
    {
      accessorKey: "series_name",
      header: "Série",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.series_name ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "enrolled_count",
      header: "Élèves",
      cell: ({ row }) => (
        <EnrolledCell
          enrolled={row.original.enrolled_count}
          max={row.original.max_students}
        />
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
