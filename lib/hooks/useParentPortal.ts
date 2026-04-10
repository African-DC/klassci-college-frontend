"use client"

import { useQuery } from "@tanstack/react-query"
import { parentPortalApi } from "@/lib/api/parent-portal"

export const parentKeys = {
  all: ["parent"] as const,
  dashboard: () => ["parent", "dashboard"] as const,
  childGrades: (childId: number, trimester?: string) =>
    ["parent", "child-grades", childId, trimester] as const,
  childFees: (childId: number) => ["parent", "child-fees", childId] as const,
  childBulletins: (childId: number) => ["parent", "child-bulletins", childId] as const,
}

// Dashboard parent — résumé de tous les enfants
export function useParentDashboard() {
  return useQuery({
    queryKey: parentKeys.dashboard(),
    queryFn: () => parentPortalApi.getDashboard(),
    staleTime: 1000 * 60 * 5,
  })
}

// Liste des enfants (réutilise le dashboard, sélectionne uniquement les enfants)
export function useParentChildren() {
  const query = useParentDashboard()
  return {
    ...query,
    data: query.data?.children,
  }
}

// Notes d'un enfant par trimestre
export function useParentChildGrades(childId: number | undefined, trimester?: string) {
  return useQuery({
    // enabled empêche l'exécution si childId est undefined
    queryKey: parentKeys.childGrades(childId as number, trimester),
    queryFn: () => parentPortalApi.getChildGrades(childId as number, trimester),
    enabled: childId !== undefined && childId > 0,
    staleTime: 1000 * 60 * 5,
  })
}

// Frais d'un enfant
export function useParentChildFees(childId: number | undefined) {
  return useQuery({
    queryKey: parentKeys.childFees(childId as number),
    queryFn: () => parentPortalApi.getChildFees(childId as number),
    enabled: childId !== undefined && childId > 0,
    staleTime: 1000 * 60 * 5,
  })
}

export function useParentChildBulletins(childId: number | undefined) {
  return useQuery({
    queryKey: parentKeys.childBulletins(childId as number),
    queryFn: () => parentPortalApi.getChildBulletins(childId as number),
    enabled: childId !== undefined && childId > 0,
    staleTime: 1000 * 60 * 5,
  })
}
