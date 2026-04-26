"use client"

import { ListTree } from "lucide-react"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { SeriesTable } from "./SeriesTable"
import { SeriesCreateModal } from "./SeriesCreateModal"

export function SeriesPageClient() {
  return (
    <CrudPageLayout
      title="Series"
      subtitle="Gestion des series par niveau"
      createLabel="Nouvelle serie"
      icon={ListTree}
      table={<SeriesTable />}
      createModal={(props) => <SeriesCreateModal {...props} />}
    />
  )
}
