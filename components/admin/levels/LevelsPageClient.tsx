"use client"

import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { LevelsTable } from "./LevelsTable"
import { LevelCreateModal } from "./LevelCreateModal"

export function LevelsPageClient() {
  return (
    <CrudPageLayout
      title="Niveaux"
      subtitle="Gestion des niveaux scolaires"
      createLabel="Nouveau niveau"
      table={<LevelsTable />}
      createModal={(props) => <LevelCreateModal {...props} />}
    />
  )
}
