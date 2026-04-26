"use client"

import { useCallback, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useSubjects, useDeleteSubject } from "@/lib/hooks/useSubjects"
import { useLevels } from "@/lib/hooks/useLevels"
import type { Subject } from "@/lib/contracts/subject"
import { Badge } from "@/components/ui/badge"
import { CrudTable, type FilterConfig } from "@/components/shared/CrudTable"
import { SubjectEditModal } from "./SubjectEditModal"
import { useDebounce } from "@/lib/hooks/useDebounce"

export function SubjectsTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const debouncedSearch = useDebounce(search)

  const { data: levelsData } = useLevels({ size: 100 })
  const levelOptions = useMemo(
    () => levelsData?.items?.map((l) => ({ value: l.id.toString(), label: l.name })) ?? [],
    [levelsData],
  )

  const filterConfigs: FilterConfig[] = useMemo(() => [
    { key: "level_id", label: "Niveau", type: "select", options: levelOptions },
  ], [levelOptions])

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
    ...(filters.level_id && { level_id: Number(filters.level_id) }),
  }), [page, debouncedSearch, filters])

  const { data, isLoading, isError, error, refetch } = useSubjects(params)
  const deleteMutation = useDeleteSubject()

  const columns: ColumnDef<Subject>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "level_name",
      header: "Niveau",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.level_name ?? "Tous"}
        </span>
      ),
    },
    {
      accessorKey: "series_name",
      header: "Série",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.series_name ?? "—"}
        </span>
      ),
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
      accessorKey: "hours_per_week",
      header: "Heures/sem.",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.hours_per_week}h</span>
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
      searchPlaceholder="Rechercher une matière..."
      searchValue={search}
      onSearchChange={handleSearchChange}
      filterConfigs={filterConfigs}
      filterValues={filters}
      onFilterChange={handleFilterChange}
    />
  )
}
