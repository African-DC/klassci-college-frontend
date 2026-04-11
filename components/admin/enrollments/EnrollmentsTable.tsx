"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useEnrollments, useDeleteEnrollment } from "@/lib/hooks/useEnrollments"
import type { Enrollment, EnrollmentListParams } from "@/lib/contracts/enrollment"
import { Badge } from "@/components/ui/badge"
import { CrudTable } from "@/components/shared/CrudTable"
import { EnrollmentEditModal } from "./EnrollmentEditModal"
import { EnrollmentViewModal } from "./EnrollmentViewModal"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  prospect: { label: "Prospect", variant: "outline" },
  en_validation: { label: "En validation", variant: "secondary" },
  valide: { label: "Validé", variant: "default" },
  rejete: { label: "Rejeté", variant: "destructive" },
  annule: { label: "Annulé", variant: "destructive" },
}

interface EnrollmentsTableProps {
  filters?: EnrollmentListParams
}

export function EnrollmentsTable({ filters = {} }: EnrollmentsTableProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useEnrollments({ ...filters, page })
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
      renderViewModal={({ itemId, open, onClose }) => (
        <EnrollmentViewModal enrollmentId={itemId} open={open} onClose={onClose} />
      )}
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
    />
  )
}
