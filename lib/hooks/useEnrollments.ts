"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  enrollmentsApi,
  type EnrollmentListParams,
  type EnrollmentCreateBody,
  type EnrollmentUpdateBody,
} from "@/lib/api/enrollments"

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
    mutationFn: (data: EnrollmentCreateBody) => enrollmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
    },
  })
}

export function useUpdateEnrollment(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EnrollmentUpdateBody) => enrollmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.detail(id) })
    },
  })
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => enrollmentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
    },
  })
}
