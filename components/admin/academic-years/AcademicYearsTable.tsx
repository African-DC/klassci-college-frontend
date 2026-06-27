"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CheckCircle2, Circle, CalendarRange, CalendarCheck, History, CalendarClock } from "lucide-react"
import { useAcademicYears, useDeleteAcademicYear, useSetCurrentYear } from "@/lib/hooks/useAcademicYears"
import type { AcademicYear } from "@/lib/contracts/academic-year"
import type { PaginatedResponse } from "@/lib/contracts"
import { CrudTable, type FilterConfig } from "@/components/shared/CrudTable"
import { KpiStrip, type KpiItem } from "@/components/shared/list/KpiStrip"
import { AcademicYearEditModal } from "./AcademicYearEditModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { matchesSearch } from "@/lib/utils/list-search"

type StatusFilter = "" | "current" | "past" | "upcoming"

function yearStatus(y: AcademicYear, now: number): Exclude<StatusFilter, ""> | "current" {
  if (y.is_current) return "current"
  if (new Date(y.end_date).getTime() < now) return "past"
  if (new Date(y.start_date).getTime() > now) return "upcoming"
  return "current"
}

export function AcademicYearsTable() {
  // Les années scolaires sont peu nombreuses : on charge tout et on filtre côté
  // client (recherche multi-champs + statut), pas de pagination serveur.
  const { data, isLoading, isError, error, refetch } = useAcademicYears({ size: 100 })
  const deleteMutation = useDeleteAcademicYear()
  const setCurrentMutation = useSetCurrentYear()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("")

  const allItems = useMemo(() => data?.items ?? [], [data])
  const now = Date.now()

  const kpis: KpiItem[] = useMemo(() => {
    const current = allItems.find((y) => y.is_current)
    const past = allItems.filter((y) => !y.is_current && new Date(y.end_date).getTime() < now).length
    const upcoming = allItems.filter((y) => !y.is_current && new Date(y.start_date).getTime() > now).length
    return [
      { label: "Années", value: allItems.length, icon: CalendarRange, tone: "primary" },
      { label: "Année courante", value: current?.name ?? "—", icon: CalendarCheck, tone: current ? "emerald" : "default" },
      { label: "Passées", value: past, icon: History, tone: "default" },
      { label: "À venir", value: upcoming, icon: CalendarClock, tone: "default" },
    ]
  }, [allItems, now])

  const filtered = useMemo(() => {
    return allItems.filter((y) => {
      if (statusFilter && yearStatus(y, now) !== statusFilter) return false
      return matchesSearch([y.name, y.label], search)
    })
  }, [allItems, search, statusFilter, now])

  const tableData: PaginatedResponse<AcademicYear> | undefined = data
    ? { items: filtered, total: filtered.length, page: 1, size: filtered.length || 1, total_pages: 1 }
    : undefined

  const filterConfigs: FilterConfig[] = [
    {
      key: "status",
      label: "Statut",
      type: "select",
      options: [
        { value: "current", label: "Année courante" },
        { value: "past", label: "Passées" },
        { value: "upcoming", label: "À venir" },
      ],
    },
  ]

  const columns: ColumnDef<AcademicYear>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "start_date",
      header: "Début",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.start_date).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      accessorKey: "end_date",
      header: "Fin",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.end_date).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      accessorKey: "is_current",
      header: "Statut",
      cell: ({ row }) => {
        const isCurrent = row.original.is_current
        if (isCurrent) {
          return (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Courante
            </Badge>
          )
        }
        return (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground hover:text-primary"
            disabled={setCurrentMutation.isPending}
            onClick={() => setCurrentMutation.mutate(row.original.id)}
          >
            <Circle className="h-3 w-3" />
            Définir comme courante
          </Button>
        )
      },
    },
  ], [setCurrentMutation])

  return (
    <div className="space-y-4">
      <KpiStrip items={kpis} />
      <CrudTable<AcademicYear>
        data={tableData}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        refetch={refetch}
        deleteMutation={deleteMutation}
        renderEditModal={({ itemId, open, onClose }) => (
          <AcademicYearEditModal yearId={itemId} open={open} onClose={onClose} />
        )}
        getItemLabel={(y) => y.name}
        emptyMessage="Aucune année académique trouvée"
        errorMessage="Impossible de charger les années académiques"
        deleteDescription="Cette action est irréversible. L'année académique sera définitivement supprimée."
        searchPlaceholder="Rechercher une année…"
        searchValue={search}
        onSearchChange={setSearch}
        filterConfigs={filterConfigs}
        filterValues={{ status: statusFilter }}
        onFilterChange={(_key, value) => setStatusFilter(value as StatusFilter)}
      />
    </div>
  )
}
