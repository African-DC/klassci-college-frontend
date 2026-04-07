"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useTeachers, useDeleteTeacher } from "@/lib/hooks/useTeachers"
import type { Teacher } from "@/lib/contracts/teacher"
import { CrudTable } from "@/components/shared/CrudTable"
import { TeacherEditModal } from "./TeacherEditModal"

export function TeachersTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useTeachers({ page })
  const deleteMutation = useDeleteTeacher()

  const columns: ColumnDef<Teacher>[] = useMemo(() => [
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
      accessorKey: "speciality",
      header: "Spécialité",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.speciality ?? "—"}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Téléphone",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.phone ?? "—"}</span>
      ),
    },
  ], [])

  return (
    <CrudTable<Teacher>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      deleteMutation={deleteMutation}
      renderEditModal={({ itemId, open, onClose }) => (
        <TeacherEditModal teacherId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(t) => `${t.last_name} ${t.first_name}`}
      emptyMessage="Aucun enseignant trouvé"
      errorMessage="Impossible de charger les enseignants"
      deleteDescription="Cette action est irréversible. L'enseignant sera définitivement supprimé."
      page={page}
      onPageChange={setPage}
    />
  )
}
