"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useEnrollments, useDeleteEnrollment } from "@/lib/hooks/useEnrollments"
import type { Enrollment, EnrollmentListParams } from "@/lib/contracts/enrollment"
import { Badge } from "@/components/ui/badge"
import { CrudTable } from "@/components/shared/CrudTable"
import { EnrollmentEditModal } from "./EnrollmentEditModal"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  affecte: { label: "Affecté", variant: "default" },
  reaffecte: { label: "Réaffecté", variant: "secondary" },
  non_affecte: { label: "Non affecté", variant: "outline" },
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
      accessorKey: "student_name",
      header: "Élève",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.student_name}</span>
      ),
    },
    {
      accessorKey: "class_name",
      header: "Classe",
    },
    {
      accessorKey: "academic_year_label",
      header: "Année",
    },
    {
      accessorKey: "assignment_status",
      header: "Statut",
      cell: ({ row }) => {
        const status = statusConfig[row.original.assignment_status]
        return (
          <Badge variant={status?.variant ?? "outline"}>
            {status?.label ?? row.original.assignment_status}
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
      renderEditModal={({ itemId, open, onClose }) => (
        <EnrollmentEditModal enrollmentId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(e) => e.student_name}
      emptyMessage="Aucune inscription trouvée"
      errorMessage="Impossible de charger les inscriptions"
      deleteTitle="Supprimer l'inscription"
      deleteDescription="Cette action est irréversible. L'inscription sera définitivement supprimée."
      page={page}
      onPageChange={setPage}
    />
  )
}
