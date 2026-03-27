"use client"

import { DataError } from "@/components/shared/DataError"

export default function ParentChildrenError({ reset }: { reset: () => void }) {
  return <DataError message="Erreur lors du chargement de la liste des enfants." onRetry={reset} />
}
