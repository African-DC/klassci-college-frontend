"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { installmentsApi } from "@/lib/api/installments"
import type { InstallmentDraft } from "@/lib/contracts/installment"

export const installmentKeys = {
  all: ["installments"] as const,
  grid: (yearId: number) => ["installments", "grid", yearId] as const,
  schedule: (enrollmentId: number) => ["installments", "schedule", enrollmentId] as const,
}

export function useInstallmentGrid(academicYearId: number | undefined) {
  return useQuery({
    queryKey: installmentKeys.grid(academicYearId ?? 0),
    queryFn: () => installmentsApi.grid(academicYearId as number),
    enabled: Boolean(academicYearId),
    staleTime: 1000 * 60 * 5,
  })
}

export function useEnrollmentSchedule(enrollmentId: number | undefined) {
  return useQuery({
    queryKey: installmentKeys.schedule(enrollmentId ?? 0),
    queryFn: () => installmentsApi.schedule(enrollmentId as number),
    enabled: Boolean(enrollmentId),
    staleTime: 1000 * 60,
  })
}

export function useReplaceInstallmentGrid(academicYearId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (installments: InstallmentDraft[]) =>
      installmentsApi.replaceGrid(academicYearId as number, installments),
    onSuccess: () => {
      // Les échéanciers dérivent de la grille : les invalider tous, sinon une
      // fiche déjà ouverte continuerait d'afficher l'ancien calendrier.
      queryClient.invalidateQueries({ queryKey: installmentKeys.all })
      toast.success("Tranches enregistrées")
    },
    onError: (err) => {
      toast.error("Enregistrement impossible", { description: err.message })
    },
  })
}
