"use client"

import { useQuery } from "@tanstack/react-query"
import { auditApi } from "@/lib/api/audit"
import type { AuditQuery } from "@/lib/contracts/audit"

export const auditKeys = {
  all: ["audit"] as const,
  list: (query: AuditQuery) => ["audit", "list", query] as const,
  filters: () => ["audit", "filters"] as const,
}

export function useAuditJournal(query: AuditQuery) {
  return useQuery({
    queryKey: auditKeys.list(query),
    queryFn: () => auditApi.list(query),
    // Le journal est une photographie : on ne rejoue pas la requête à chaque
    // retour d'onglet, l'utilisateur rafraîchit s'il veut la suite.
    staleTime: 30_000,
  })
}

export function useAuditFilters() {
  return useQuery({
    queryKey: auditKeys.filters(),
    queryFn: () => auditApi.filters(),
    staleTime: 5 * 60_000,
  })
}
