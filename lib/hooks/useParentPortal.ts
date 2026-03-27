"use client"

import { useQuery } from "@tanstack/react-query"
import { parentPortalApi } from "@/lib/api/parent-portal"

export const parentKeys = {
  all: ["parent"] as const,
  dashboard: () => ["parent", "dashboard"] as const,
  childGrades: (childId: number, trimester?: string) =>
    ["parent", "child-grades", childId, trimester] as const,
  childFees: (childId: number) => ["parent", "child-fees", childId] as const,
}

// Dashboard parent — résumé de tous les enfants
export function useParentDashboard() {
  return useQuery({
    queryKey: parentKeys.dashboard(),
    queryFn: () => parentPortalApi.getDashboard(),
    staleTime: 1000 * 60 * 5,
  })
}

// Notes d'un enfant par trimestre
export function useParentChildGrades(childId: number | undefined, trimester?: string) {
  return useQuery({
    queryKey: parentKeys.childGrades(childId!, trimester),
    queryFn: () => parentPortalApi.getChildGrades(childId!, trimester),
    enabled: !!childId,
    staleTime: 1000 * 60 * 5,
  })
}

// Frais d'un enfant
export function useParentChildFees(childId: number | undefined) {
  return useQuery({
    queryKey: parentKeys.childFees(childId!),
    queryFn: () => parentPortalApi.getChildFees(childId!),
    enabled: !!childId,
    staleTime: 1000 * 60 * 5,
  })
}
