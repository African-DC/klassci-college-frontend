"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CheckCircle2, Circle } from "lucide-react"
import { useAcademicYears, useDeleteAcademicYear, useSetCurrentYear } from "@/lib/hooks/useAcademicYears"
import type { AcademicYear } from "@/lib/contracts/academic-year"
import { CrudTable } from "@/components/shared/CrudTable"
import { AcademicYearEditModal } from "./AcademicYearEditModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function AcademicYearsTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useAcademicYears({ page })
  const deleteMutation = useDeleteAcademicYear()
  const setCurrentMutation = useSetCurrentYear()

  const columns: ColumnDef<AcademicYear>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "start_date",
      header: "Debut",
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
            Definir comme courante
          </Button>
        )
      },
    },
  ], [setCurrentMutation])

  return (
    <CrudTable<AcademicYear>
      data={data}
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
      emptyMessage="Aucune annee academique trouvee"
      errorMessage="Impossible de charger les annees academiques"
      deleteDescription="Cette action est irreversible. L'annee academique sera definitivement supprimee."
      page={page}
      onPageChange={setPage}
    />
  )
}
