"use client"

import { DataError } from "@/components/shared/DataError"

export default function ParentChildGradesError({ reset }: { reset: () => void }) {
  return <DataError message="Erreur lors du chargement des notes." onRetry={reset} />
}
