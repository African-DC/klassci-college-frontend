"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useRooms, useDeleteRoom } from "@/lib/hooks/useRooms"
import type { Room } from "@/lib/contracts/room"
import { CrudTable } from "@/components/shared/CrudTable"
import { RoomEditModal } from "./RoomEditModal"

export function RoomsTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useRooms({ page })
  const deleteMutation = useDeleteRoom()

  const columns: ColumnDef<Room>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "capacity",
      header: "Capacite",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.capacity ?? "\u2014"}</span>
      ),
    },
  ], [])

  return (
    <CrudTable<Room>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      deleteMutation={deleteMutation}
      renderEditModal={({ itemId, open, onClose }) => (
        <RoomEditModal roomId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(r) => r.name}
      emptyMessage="Aucune salle trouvee"
      errorMessage="Impossible de charger les salles"
      deleteDescription="Cette action est irreversible. La salle sera definitivement supprimee."
      page={page}
      onPageChange={setPage}
    />
  )
}
