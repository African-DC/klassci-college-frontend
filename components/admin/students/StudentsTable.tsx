"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { useStudents, useDeleteStudent } from "@/lib/hooks/useStudents"
import type { Student } from "@/lib/contracts/student"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CrudTable } from "@/components/shared/CrudTable"
import { StudentEditModal } from "./StudentEditModal"

export function StudentsTable() {
  const router = useRouter()
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
      cell: ({ row }) => {
        const s = row.original
        const initials = `${s.first_name?.[0] ?? ""}${s.last_name?.[0] ?? ""}`.toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {s.photo_url && <AvatarImage src={s.photo_url} alt={`${s.first_name} ${s.last_name}`} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{s.last_name} {s.first_name}</span>
          </div>
        )
      },
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
      onRowClick={(item) => router.push(`/admin/students/${item.id}`)}
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
