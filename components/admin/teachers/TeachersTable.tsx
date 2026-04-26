"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { useTeachers, useDeleteTeacher } from "@/lib/hooks/useTeachers"
import type { Teacher } from "@/lib/contracts/teacher"
import { CrudTable, type FilterConfig } from "@/components/shared/CrudTable"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { TeacherEditModal } from "./TeacherEditModal"
import { getUploadUrl } from "@/lib/utils"

export function TeachersTable() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const debouncedSearch = useDebounce(search)

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }, [])

  const params = useMemo(() => ({
    page,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filters.speciality && { speciality: filters.speciality }),
  }), [page, debouncedSearch, filters])

  const { data, isLoading, isError, error, refetch } = useTeachers(params)
  const deleteMutation = useDeleteTeacher()

  const filterConfigs: FilterConfig[] = useMemo(() => [
    { key: "speciality", label: "Spécialité", type: "text", placeholder: "Filtrer par spécialité..." },
  ], [])

  const columns: ColumnDef<Teacher>[] = useMemo(() => [
    {
      accessorKey: "last_name",
      header: "Nom",
      cell: ({ row }) => {
        const t = row.original
        const initials = `${t.first_name?.[0] ?? ""}${t.last_name?.[0] ?? ""}`.toUpperCase()
        const photoSrc = getUploadUrl((t as Record<string, unknown>).photo_url as string | null | undefined)
        return (
          <div className="flex items-center gap-3">
            {photoSrc ? (
              <img
                src={photoSrc}
                alt={`${t.first_name} ${t.last_name}`}
                className="h-10 w-10 shrink-0 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-border">
                <span className="text-xs font-semibold text-primary">{initials}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium truncate">{t.last_name} {t.first_name}</p>
              {t.speciality && (
                <p className="text-[10px] text-muted-foreground">{t.speciality}</p>
              )}
            </div>
          </div>
        )
      },
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
      filterConfigs={filterConfigs}
      filterValues={filters}
      onFilterChange={handleFilterChange}
    />
  )
}
