"use client"

import { DataError } from "@/components/shared/DataError"

export default function ParentDashboardError({ reset }: { reset: () => void }) {
  return <DataError message="Erreur lors du chargement du tableau de bord." onRetry={reset} />
}
