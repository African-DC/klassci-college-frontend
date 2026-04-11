"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useStudents, useDeleteStudent } from "@/lib/hooks/useStudents"
import type { Student } from "@/lib/contracts/student"
import { Badge } from "@/components/ui/badge"
import { CrudTable } from "@/components/shared/CrudTable"
import { StudentEditModal } from "./StudentEditModal"
import { StudentViewModal } from "./StudentViewModal"

export function StudentsTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useStudents({ page })
  const deleteMutation = useDeleteStudent()

  const columns: ColumnDef<Student>[] = useMemo(() => [
    {
      accessorKey: "enrollment_number",
      header: "Matricule",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.enrollment_number ?? "—"}</span>
      ),
    },
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
      accessorKey: "genre",
      header: "Genre",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.genre === "M" ? "Masculin" : row.original.genre === "F" ? "Féminin" : "—"}
        </Badge>
      ),
    },
  ], [])

  return (
    <CrudTable<Student>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      deleteMutation={deleteMutation}
      renderViewModal={({ itemId, open, onClose }) => (
        <StudentViewModal studentId={itemId} open={open} onClose={onClose} />
      )}
      renderEditModal={({ itemId, open, onClose }) => (
        <StudentEditModal studentId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(s) => `${s.last_name} ${s.first_name}`}
      emptyMessage="Aucun élève trouvé"
      errorMessage="Impossible de charger les élèves"
      deleteDescription="Cette action est irréversible. L'élève sera définitivement supprimé."
      page={page}
      onPageChange={setPage}
    />
  )
}
