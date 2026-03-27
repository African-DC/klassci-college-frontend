"use client"

import { DataError } from "@/components/shared/DataError"

export default function FeesError({ reset }: { reset: () => void }) {
  return <DataError message="Impossible de charger les frais." onRetry={reset} />
}
