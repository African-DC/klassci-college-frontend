"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { useStaffList, useDeleteStaff } from "@/lib/hooks/useStaff"
import type { Staff } from "@/lib/contracts/staff"
import { CrudTable, type FilterConfig } from "@/components/shared/CrudTable"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { StaffEditModal } from "./StaffEditModal"
import { getUploadUrl } from "@/lib/utils"

export function StaffTable() {
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
    ...(filters.position && { position: filters.position }),
  }), [page, debouncedSearch, filters])

  const { data, isLoading, isError, error, refetch } = useStaffList(params)
  const deleteMutation = useDeleteStaff()

  const filterConfigs: FilterConfig[] = useMemo(() => [
    { key: "position", label: "Poste", type: "text", placeholder: "Filtrer par poste..." },
  ], [])

  const columns: ColumnDef<Staff>[] = useMemo(() => [
    {
      accessorKey: "last_name",
      header: "Nom",
      cell: ({ row }) => {
        const s = row.original
        const initials = `${s.first_name?.[0] ?? ""}${s.last_name?.[0] ?? ""}`.toUpperCase()
        const photoSrc = getUploadUrl((s as Record<string, unknown>).photo_url as string | null | undefined)
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
              {s.position && (
                <p className="text-[10px] text-muted-foreground">{s.position}</p>
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
    <CrudTable<Staff>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      deleteMutation={deleteMutation}
      onRowClick={(item) => router.push(`/admin/staff/${item.id}`)}
      renderEditModal={({ itemId, open, onClose }) => (
        <StaffEditModal staffId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(s) => `${s.last_name} ${s.first_name}`}
      emptyMessage="Aucun personnel trouvé"
      errorMessage="Impossible de charger le personnel"
      deleteDescription="Cette action est irréversible. Le membre du personnel sera définitivement supprimé."
      searchPlaceholder="Rechercher un membre du personnel..."
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
