"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { enrollmentsApi } from "@/lib/api/enrollments"
import type {
  Enrollment,
  EnrollmentListParams,
  EnrollmentCreate,
  EnrollmentUpdate,
} from "@/lib/contracts/enrollment"
import type { PaginatedResponse } from "@/lib/contracts"

export const enrollmentKeys = {
  all: ["enrollments"] as const,
  list: (params: EnrollmentListParams) => ["enrollments", "list", params] as const,
  detail: (id: number) => ["enrollments", id] as const,
}

export function useEnrollments(params: EnrollmentListParams = {}) {
  return useQuery({
    queryKey: enrollmentKeys.list(params),
    queryFn: () => enrollmentsApi.list(params),
    staleTime: 1000 * 60 * 5,
  })
}

export function useEnrollment(id: number) {
  return useQuery({
    queryKey: enrollmentKeys.detail(id),
    queryFn: () => enrollmentsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EnrollmentCreate) => enrollmentsApi.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: enrollmentKeys.all })
      const queries = queryClient.getQueriesData<PaginatedResponse<Enrollment>>({
        queryKey: enrollmentKeys.all,
      })
      const previous = new Map(queries)

      for (const [key, old] of queries) {
        if (!old) continue
        queryClient.setQueryData(key, {
          ...old,
          total: old.total + 1,
          data: [
            { ...newData, id: -Date.now(), student_name: "", class_name: "", academic_year_label: "", created_at: "", updated_at: "" } as Enrollment,
            ...old.data,
          ],
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: _err.message })
    },
    onSuccess: () => {
      toast.success("Inscription creee avec succes")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
    },
  })
}

export function useUpdateEnrollment(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EnrollmentUpdate) => enrollmentsApi.update(id, data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: enrollmentKeys.all })
      await queryClient.cancelQueries({ queryKey: enrollmentKeys.detail(id) })

      const previousDetail = queryClient.getQueryData<Enrollment>(enrollmentKeys.detail(id))
      const queries = queryClient.getQueriesData<PaginatedResponse<Enrollment>>({
        queryKey: enrollmentKeys.all,
      })
      const previousList = new Map(queries)

      if (previousDetail) {
        queryClient.setQueryData(enrollmentKeys.detail(id), { ...previousDetail, ...newData })
      }

      for (const [key, old] of queries) {
        if (!old) continue
        queryClient.setQueryData(key, {
          ...old,
          data: old.data.map((e) => (e.id === id ? { ...e, ...newData } : e)),
        })
      }

      return { previousDetail, previousList }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(enrollmentKeys.detail(id), context.previousDetail)
      }
      if (context?.previousList) {
        for (const [key, data] of context.previousList) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: _err.message })
    },
    onSuccess: () => {
      toast.success("Inscription mise a jour")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.detail(id) })
    },
  })
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => enrollmentsApi.remove(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: enrollmentKeys.all })
      const queries = queryClient.getQueriesData<PaginatedResponse<Enrollment>>({
        queryKey: enrollmentKeys.all,
      })
      const previous = new Map(queries)

      for (const [key, old] of queries) {
        if (!old) continue
        queryClient.setQueryData(key, {
          ...old,
          total: old.total - 1,
          data: old.data.filter((e) => e.id !== deletedId),
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: _err.message })
    },
    onSuccess: () => {
      toast.success("Inscription supprimee")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
    },
  })
}
