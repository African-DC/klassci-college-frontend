"use client"

import { useQuery } from "@tanstack/react-query"
import { feeCategoryLedgerApi, type LedgerCriteres } from "@/lib/api/fee-category-ledger"

export const ledgerKeys = {
  all: ["fee-category-ledger"] as const,
  point: (c: LedgerCriteres) =>
    ["fee-category-ledger", c.categoryId, c.academicYearId, c.classId, c.dateFrom, c.dateTo] as const,
}

/**
 * Le point sur une catégorie, pour le périmètre demandé.
 *
 * Fraîcheur courte : une caissière encaisse pendant qu'on lit le document, et
 * une minute de retard sur un total qu'on s'apprête à envoyer à un prestataire
 * est une minute de trop.
 */
export function useFeeCategoryLedger(criteres: Partial<LedgerCriteres>) {
  const pret = Boolean(criteres.categoryId) && Boolean(criteres.academicYearId)

  return useQuery({
    queryKey: pret
      ? ledgerKeys.point(criteres as LedgerCriteres)
      : [...ledgerKeys.all, "incomplet"],
    queryFn: () => feeCategoryLedgerApi.point(criteres as LedgerCriteres),
    enabled: pret,
    staleTime: 1000 * 15,
  })
}
