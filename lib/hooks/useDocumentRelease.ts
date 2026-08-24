"use client"

import { useQuery } from "@tanstack/react-query"
import { documentReleaseApi } from "@/lib/api/document-release"

export const documentReleaseKeys = {
  status: (studentId: number) => ["document-release", studentId] as const,
}

/**
 * Etat de la porte de paiement d'un élève.
 *
 * Appelé avant d'afficher les boutons de téléchargement : voir « Retenu :
 * 75 000 FCFA d'échéances en retard » vaut mieux que cliquer et se prendre
 * un refus.
 */
export function useDocumentReleaseStatus(studentId: number | null) {
  return useQuery({
    queryKey: documentReleaseKeys.status(studentId ?? 0),
    queryFn: () => documentReleaseApi.status(studentId as number),
    enabled: studentId !== null,
    staleTime: 60_000,
  })
}
