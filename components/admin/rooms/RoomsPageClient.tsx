"use client"

import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { RoomsTable } from "./RoomsTable"
import { RoomCreateModal } from "./RoomCreateModal"

export function RoomsPageClient() {
  return (
    <CrudPageLayout
      title="Salles"
      subtitle="Gestion des salles de cours"
      createLabel="Nouvelle salle"
      table={<RoomsTable />}
      createModal={(props) => <RoomCreateModal {...props} />}
    />
  )
}
