"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useTeachers, useDeleteTeacher } from "@/lib/hooks/useTeachers"
import type { Teacher } from "@/lib/contracts/teacher"
import { Badge } from "@/components/ui/badge"
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
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.email ?? "—"}</span>
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
      accessorKey: "subject_names",
      header: "Matières",
      cell: ({ row }) => {
        const subjects = row.original.subject_names
        if (!subjects || subjects.length === 0) return <span className="text-sm text-muted-foreground">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {subjects.map((s) => (
              <Badge key={s} variant="outline" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: "is_active",
      header: "Statut",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active !== false ? "default" : "secondary"}>
          {row.original.is_active !== false ? "Actif" : "Inactif"}
        </Badge>
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
