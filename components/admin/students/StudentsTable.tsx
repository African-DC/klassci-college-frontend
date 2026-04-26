"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { useStudents, useDeleteStudent } from "@/lib/hooks/useStudents"
import type { Student } from "@/lib/contracts/student"
import { Badge } from "@/components/ui/badge"
import { CrudTable, type FilterConfig } from "@/components/shared/CrudTable"
import { getUploadUrl } from "@/lib/utils"
import { StudentEditModal } from "./StudentEditModal"
import { useDebounce } from "@/lib/hooks/useDebounce"

const genderFilterOptions = [
  { value: "M", label: "Masculin" },
  { value: "F", label: "Féminin" },
]

const filterConfigs: FilterConfig[] = [
  { key: "genre", label: "Genre", type: "select", options: genderFilterOptions },
]

export function StudentsTable() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const debouncedSearch = useDebounce(search)

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const params = useMemo(() => ({
    page,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filters.genre && { genre: filters.genre }),
  }), [page, debouncedSearch, filters])

  const { data, isLoading, isError, error, refetch } = useStudents(params)
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
        const photoSrc = getUploadUrl(s.photo_url)
        return (
          <div className="flex items-center gap-3">
            {photoSrc ? (
              <img
                src={photoSrc}
                alt={`${s.first_name} ${s.last_name}`}
                className="h-10 w-10 shrink-0 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-border">
                <span className="text-xs font-semibold text-primary">{initials}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium truncate">{s.last_name} {s.first_name}</p>
              {s.enrollment_number && (
                <p className="text-[10px] font-mono text-muted-foreground">{s.enrollment_number}</p>
              )}
            </div>
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
      searchPlaceholder="Rechercher un élève..."
      searchValue={search}
      onSearchChange={handleSearchChange}
      filterConfigs={filterConfigs}
      filterValues={filters}
      onFilterChange={handleFilterChange}
    />
  )
}
