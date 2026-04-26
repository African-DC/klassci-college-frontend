"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { academicYearsApi } from "@/lib/api/academic-years"
import type { AcademicYear, AcademicYearCreate, AcademicYearUpdate } from "@/lib/contracts/academic-year"
import { createCrudHooks } from "./createCrudHooks"
import { useAcademicYearStore } from "@/lib/stores/useAcademicYearStore"

const {
  keys: academicYearKeys,
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<AcademicYear, AcademicYearCreate, AcademicYearUpdate>(
  "academic-years",
  academicYearsApi,
  {
    created: "Annee academique creee avec succes",
    updated: "Annee academique mise a jour",
    deleted: "Annee academique supprimee",
  },
)

export { academicYearKeys }
export const useAcademicYears = useList
export const useAcademicYear = useDetail
export const useCreateAcademicYear = useCreate
export const useUpdateAcademicYear = useUpdate
export const useDeleteAcademicYear = useDelete

export function useSetCurrentYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (yearId: number) => academicYearsApi.setAsCurrent(yearId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: academicYearKeys.all })
      useAcademicYearStore.getState().setCurrentYear(data)
      toast.success("Annee academique courante mise a jour")
    },
    onError: (err) => {
      toast.error("Erreur", { description: err.message })
    },
  })
}
