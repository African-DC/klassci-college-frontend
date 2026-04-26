"use client"

import { Layers } from "lucide-react"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { LevelsTable } from "./LevelsTable"
import { LevelCreateModal } from "./LevelCreateModal"

export function LevelsPageClient() {
  return (
    <CrudPageLayout
      title="Niveaux"
      subtitle="Gestion des niveaux scolaires"
      createLabel="Nouveau niveau"
      icon={Layers}
      table={<LevelsTable />}
      createModal={(props) => <LevelCreateModal {...props} />}
    />
  )
}
