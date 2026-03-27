"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useSubjects, useDeleteSubject } from "@/lib/hooks/useSubjects"
import type { Subject } from "@/lib/contracts/subject"
import { Badge } from "@/components/ui/badge"
import { CrudTable } from "@/components/shared/CrudTable"
import { SubjectEditModal } from "./SubjectEditModal"

export function SubjectsTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useSubjects({ page })
  const deleteMutation = useDeleteSubject()

  const columns: ColumnDef<Subject>[] = useMemo(() => [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "coefficient",
      header: "Coeff.",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono">
          {row.original.coefficient}
        </Badge>
      ),
    },
    {
      accessorKey: "category",
      header: "Catégorie",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.category ?? "—"}</span>
      ),
    },
    {
      accessorKey: "level",
      header: "Niveau",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.level ?? "Tous"}</span>
      ),
    },
  ], [])

  return (
    <CrudTable<Subject>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      deleteMutation={deleteMutation}
      renderEditModal={({ itemId, open, onClose }) => (
        <SubjectEditModal subjectId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(s) => s.name}
      emptyMessage="Aucune matière trouvée"
      errorMessage="Impossible de charger les matières"
      deleteDescription="Cette action est irréversible. La matière sera définitivement supprimée."
      page={page}
      onPageChange={setPage}
    />
  )
}
