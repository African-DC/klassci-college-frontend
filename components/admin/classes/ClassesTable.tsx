"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useClasses, useDeleteClass } from "@/lib/hooks/useClasses"
import type { Class } from "@/lib/contracts/class"
import { Badge } from "@/components/ui/badge"
import { CrudTable } from "@/components/shared/CrudTable"
import { ClassEditModal } from "./ClassEditModal"

export function ClassesTable() {
  const { data, isLoading, isError, error, refetch } = useClasses()
  const deleteMutation = useDeleteClass()

  const columns: ColumnDef<Class>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "level",
      header: "Niveau",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono">
          {row.original.level}
        </Badge>
      ),
    },
    {
      accessorKey: "section",
      header: "Section",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.section ?? "—"}</span>
      ),
    },
    {
      accessorKey: "capacity",
      header: "Capacité",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.capacity ?? "—"}</span>
      ),
    },
    {
      accessorKey: "teacher_name",
      header: "Titulaire",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.teacher_name ?? "—"}</span>
      ),
    },
  ], [])

  return (
    <CrudTable<Class>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      deleteMutation={deleteMutation}
      renderEditModal={({ itemId, open, onClose }) => (
        <ClassEditModal classId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(c) => c.name}
      emptyMessage="Aucune classe trouvée"
      errorMessage="Impossible de charger les classes"
      deleteDescription="Cette action est irréversible. La classe sera définitivement supprimée."
    />
  )
}
