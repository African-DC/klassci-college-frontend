"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useStudents, useDeleteStudent } from "@/lib/hooks/useStudents"
import type { Student } from "@/lib/contracts/student"
import { Badge } from "@/components/ui/badge"
import { CrudTable } from "@/components/shared/CrudTable"
import { StudentEditModal } from "./StudentEditModal"

export function StudentsTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useStudents({ page })
  const deleteMutation = useDeleteStudent()

  const columns: ColumnDef<Student>[] = useMemo(() => [
    {
      accessorKey: "matricule",
      header: "Matricule",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.matricule ?? "—"}</span>
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
      accessorKey: "gender",
      header: "Genre",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.gender === "M" ? "Masculin" : row.original.gender === "F" ? "Féminin" : "—"}
        </Badge>
      ),
    },
    {
      accessorKey: "class_name",
      header: "Classe",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.class_name ?? "—"}</Badge>
      ),
    },
    {
      accessorKey: "parent_phone",
      header: "Tél. parent",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.parent_phone ?? "—"}</span>
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
