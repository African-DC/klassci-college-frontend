"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { enrollmentsApi } from "@/lib/api/enrollments"
import type { Enrollment, EnrollmentCreate, EnrollmentUpdate, NewEnrollment, ReEnrollment } from "@/lib/contracts/enrollment"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: enrollmentKeys,
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Enrollment, EnrollmentCreate, EnrollmentUpdate>("enrollments", enrollmentsApi, {
  created: "Inscription creee avec succes",
  updated: "Inscription mise a jour",
  deleted: "Inscription supprimee",
})

export { enrollmentKeys }
export const useEnrollments = useList
export const useEnrollment = useDetail
export const useCreateEnrollment = useCreate
export const useUpdateEnrollment = useUpdate
export const useDeleteEnrollment = useDelete

export function useCreateWithStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NewEnrollment) => enrollmentsApi.createWithStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      queryClient.invalidateQueries({ queryKey: ["students"] })
      toast.success("Inscription enregistree")
    },
    onError: (error: Error) => {
      toast.error("Erreur", { description: error.message })
    },
  })
}

export function useReEnroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ReEnrollment) => enrollmentsApi.reEnroll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      toast.success("Reinscription enregistree")
    },
    onError: (error: Error) => {
      toast.error("Erreur", { description: error.message })
    },
  })
}

export function useFeeVariants(classId: number | undefined) {
  return useQuery({
    queryKey: ["enrollments", "fee-variants", classId],
    queryFn: () => enrollmentsApi.getFeeVariants(classId!),
    enabled: !!classId,
  })
}

export function useValidateEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => enrollmentsApi.validate(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.detail(data.id) })
      toast.success("Inscription validée")
    },
    onError: (error: Error) => {
      toast.error("Validation impossible", { description: error.message })
    },
  })
}
