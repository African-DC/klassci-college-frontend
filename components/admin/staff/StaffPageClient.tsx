"use client"

import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { StaffTable } from "./StaffTable"
import { StaffCreateModal } from "./StaffCreateModal"

export function StaffPageClient() {
  return (
    <CrudPageLayout
      title="Personnel"
      subtitle="Gestion du personnel administratif"
      createLabel="Nouveau personnel"
      table={<StaffTable />}
      createModal={(props) => <StaffCreateModal {...props} />}
    />
  )
}
