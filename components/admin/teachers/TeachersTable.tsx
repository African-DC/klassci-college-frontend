"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { useTeachers, useDeleteTeacher } from "@/lib/hooks/useTeachers"
import type { Teacher } from "@/lib/contracts/teacher"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CrudTable } from "@/components/shared/CrudTable"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { TeacherEditModal } from "./TeacherEditModal"

export function TeachersTable() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search)

  const params = useMemo(() => ({
    page,
    ...(debouncedSearch && { search: debouncedSearch }),
  }), [page, debouncedSearch])

  const { data, isLoading, isError, error, refetch } = useTeachers(params)
  const deleteMutation = useDeleteTeacher()

  const columns: ColumnDef<Teacher>[] = useMemo(() => [
    {
      accessorKey: "last_name",
      header: "Nom",
      cell: ({ row }) => {
        const t = row.original
        const initials = `${t.first_name?.[0] ?? ""}${t.last_name?.[0] ?? ""}`.toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{t.last_name} {t.first_name}</span>
          </div>
        )
      },
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
      onRowClick={(item) => router.push(`/admin/teachers/${item.id}`)}
      renderEditModal={({ itemId, open, onClose }) => (
        <TeacherEditModal teacherId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(t) => `${t.last_name} ${t.first_name}`}
      emptyMessage="Aucun enseignant trouvé"
      errorMessage="Impossible de charger les enseignants"
      deleteDescription="Cette action est irréversible. L'enseignant sera définitivement supprimé."
      searchPlaceholder="Rechercher un enseignant..."
      searchValue={search}
      onSearchChange={(v) => { setSearch(v); setPage(1) }}
      page={page}
      onPageChange={setPage}
    />
  )
}
