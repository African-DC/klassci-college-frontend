"use client"

import { DataError } from "@/components/shared/DataError"

export default function PaymentsError({ reset }: { reset: () => void }) {
  return <DataError message="Impossible de charger les paiements." onRetry={reset} />
}
