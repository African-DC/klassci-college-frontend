"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { useEnrollments, useDeleteEnrollment } from "@/lib/hooks/useEnrollments"
import type { Enrollment, EnrollmentListParams } from "@/lib/contracts/enrollment"
import { Badge } from "@/components/ui/badge"
import { CrudTable, type FilterConfig } from "@/components/shared/CrudTable"
import { EnrollmentEditModal } from "./EnrollmentEditModal"
import { useDebounce } from "@/lib/hooks/useDebounce"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  prospect: { label: "Prospect", variant: "outline" },
  en_validation: { label: "En validation", variant: "secondary" },
  valide: { label: "Validé", variant: "default" },
  rejete: { label: "Rejeté", variant: "destructive" },
  annule: { label: "Annulé", variant: "destructive" },
}

const statusFilterOptions = [
  { value: "prospect", label: "Prospect" },
  { value: "en_validation", label: "En validation" },
  { value: "valide", label: "Validé" },
  { value: "rejete", label: "Rejeté" },
  { value: "annule", label: "Annulé" },
]

const filterConfigs: FilterConfig[] = [
  { key: "status", label: "Statut", type: "select", options: statusFilterOptions },
]

interface EnrollmentsTableProps {
  filters?: EnrollmentListParams
}

export function EnrollmentsTable({ filters: externalFilters = {} }: EnrollmentsTableProps) {
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
    ...externalFilters,
    page,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filters.status && { status: filters.status }),
  }), [externalFilters, page, debouncedSearch, filters])

  const { data, isLoading, isError, error, refetch } = useEnrollments(params)
  const deleteMutation = useDeleteEnrollment()

  const columns: ColumnDef<Enrollment>[] = useMemo(() => [
    {
      accessorKey: "id",
      header: "N°",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{row.original.id}
        </span>
      ),
      size: 60,
    },
    {
      accessorKey: "student_id",
      header: "Élève",
      cell: ({ row }) => {
        const first = row.original.student_first_name
        const last = row.original.student_last_name
        if (first || last) {
          return <span className="font-medium">{first} {last}</span>
        }
        return <span className="font-medium text-muted-foreground">#{row.original.student_id}</span>
      },
    },
    {
      accessorKey: "class_id",
      header: "Classe",
      cell: ({ row }) => row.original.class_name ?? `#${row.original.class_id}`,
    },
    {
      accessorKey: "academic_year_name",
      header: "Année",
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const status = statusConfig[row.original.status]
        return (
          <Badge variant={status?.variant ?? "outline"}>
            {status?.label ?? row.original.status}
          </Badge>
        )
      },
    },
  ], [])

  return (
    <CrudTable<Enrollment>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      deleteMutation={deleteMutation}
      onRowClick={(item) => router.push(`/admin/enrollments/${item.id}`)}
      renderEditModal={({ itemId, open, onClose }) => (
        <EnrollmentEditModal enrollmentId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(e) => `#${e.id}`}
      emptyMessage="Aucune inscription trouvée"
      errorMessage="Impossible de charger les inscriptions"
      deleteTitle="Supprimer l'inscription"
      deleteDescription="Cette action est irréversible. L'inscription sera définitivement supprimée."
      page={page}
      onPageChange={setPage}
      searchPlaceholder="Rechercher une inscription..."
      searchValue={search}
      onSearchChange={handleSearchChange}
      filterConfigs={filterConfigs}
      filterValues={filters}
      onFilterChange={handleFilterChange}
    />
  )
}
