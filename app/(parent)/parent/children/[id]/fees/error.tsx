"use client"

import { DataError } from "@/components/shared/DataError"

export default function ParentChildFeesError({ reset }: { reset: () => void }) {
  return <DataError message="Erreur lors du chargement des frais." onRetry={reset} />
}
