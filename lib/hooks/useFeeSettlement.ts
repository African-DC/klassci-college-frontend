"use client"

import { useQuery } from "@tanstack/react-query"
import { feeSettlementApi } from "@/lib/api/fee-settlement"

export const feeSettlementKeys = {
  all: ["fee-settlement"] as const,
  classe: (classId: number, yearId: number) => ["fee-settlement", classId, yearId] as const,
}

/**
 * Les soldes d'une classe, une classe à la fois.
 *
 * Même fraîcheur que la liste de saisie en lot : une caissière peut encaisser
 * pendant qu'on lit le tableau, et une minute de retard sur un « soldé »
 * enverrait relancer une famille qui vient de payer.
 */
export function useFeeSettlement(classId: number | undefined, academicYearId: number | undefined) {
  return useQuery({
    queryKey:
      classId && academicYearId
        ? feeSettlementKeys.classe(classId, academicYearId)
        : [...feeSettlementKeys.all, "none"],
    queryFn: () => feeSettlementApi.matrix(classId as number, academicYearId as number),
    enabled: Boolean(classId) && Boolean(academicYearId),
    staleTime: 1000 * 15,
  })
}
