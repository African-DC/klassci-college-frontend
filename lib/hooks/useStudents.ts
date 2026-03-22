"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { studentsApi } from "@/lib/api/students"
import type { Student, StudentCreate, StudentUpdate, StudentListParams } from "@/lib/contracts/student"
import type { PaginatedResponse } from "@/lib/contracts"

export const studentKeys = {
  all: ["students"] as const,
  list: (params: StudentListParams) => ["students", "list", params] as const,
  detail: (id: number) => ["students", id] as const,
}

export function useStudents(params: StudentListParams = {}) {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: () => studentsApi.list(params),
    staleTime: 1000 * 60 * 5,
  })
}

export function useStudent(id: number) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StudentCreate) => studentsApi.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: studentKeys.all })
      const queries = queryClient.getQueriesData<PaginatedResponse<Student>>({
        queryKey: studentKeys.all,
      })
      const previous = new Map(queries)
      for (const [key, old] of queries) {
        if (!old) continue
        queryClient.setQueryData(key, {
          ...old,
          total: old.total + 1,
          data: [
            { ...newData, id: -Date.now(), created_at: "", updated_at: "" } as Student,
            ...old.data,
          ],
        })
      }
      return { previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: err.message })
    },
    onSuccess: () => {
      toast.success("Eleve cree avec succes")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all })
    },
  })
}

export function useUpdateStudent(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StudentUpdate) => studentsApi.update(id, data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: studentKeys.all })
      await queryClient.cancelQueries({ queryKey: studentKeys.detail(id) })
      const previousDetail = queryClient.getQueryData<Student>(studentKeys.detail(id))
      const queries = queryClient.getQueriesData<PaginatedResponse<Student>>({
        queryKey: studentKeys.all,
      })
      const previousList = new Map(queries)
      if (previousDetail) {
        queryClient.setQueryData(studentKeys.detail(id), { ...previousDetail, ...newData })
      }
      for (const [key, old] of queries) {
        if (!old) continue
        queryClient.setQueryData(key, {
          ...old,
          data: old.data.map((s) => (s.id === id ? { ...s, ...newData } : s)),
        })
      }
      return { previousDetail, previousList }
    },
    onError: (err, _vars, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(studentKeys.detail(id), context.previousDetail)
      }
      if (context?.previousList) {
        for (const [key, data] of context.previousList) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: err.message })
    },
    onSuccess: () => {
      toast.success("Eleve mis a jour")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all })
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) })
    },
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => studentsApi.remove(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: studentKeys.all })
      const queries = queryClient.getQueriesData<PaginatedResponse<Student>>({
        queryKey: studentKeys.all,
      })
      const previous = new Map(queries)
      for (const [key, old] of queries) {
        if (!old) continue
        queryClient.setQueryData(key, {
          ...old,
          total: old.total - 1,
          data: old.data.filter((s) => s.id !== deletedId),
        })
      }
      return { previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: err.message })
    },
    onSuccess: () => {
      toast.success("Eleve supprime")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all })
    },
  })
}
