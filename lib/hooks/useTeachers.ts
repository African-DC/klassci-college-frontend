"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { teachersApi } from "@/lib/api/teachers"
import type { Teacher, TeacherCreate, TeacherUpdate, TeacherListParams } from "@/lib/contracts/teacher"
import type { PaginatedResponse } from "@/lib/contracts"

export const teacherKeys = {
  all: ["teachers"] as const,
  list: (params: TeacherListParams) => ["teachers", "list", params] as const,
  detail: (id: number) => ["teachers", id] as const,
}

export function useTeachers(params: TeacherListParams = {}) {
  return useQuery({
    queryKey: teacherKeys.list(params),
    queryFn: () => teachersApi.list(params),
    staleTime: 1000 * 60 * 5,
  })
}

export function useTeacher(id: number) {
  return useQuery({
    queryKey: teacherKeys.detail(id),
    queryFn: () => teachersApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateTeacher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TeacherCreate) => teachersApi.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: teacherKeys.all })
      const queries = queryClient.getQueriesData<PaginatedResponse<Teacher>>({
        queryKey: teacherKeys.all,
      })
      const previous = new Map(queries)
      for (const [key, old] of queries) {
        if (!old) continue
        queryClient.setQueryData(key, {
          ...old,
          total: old.total + 1,
          data: [
            { ...newData, id: -Date.now(), created_at: "", updated_at: "" } as Teacher,
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
      toast.success("Enseignant cree avec succes")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all })
    },
  })
}

export function useUpdateTeacher(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TeacherUpdate) => teachersApi.update(id, data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: teacherKeys.all })
      await queryClient.cancelQueries({ queryKey: teacherKeys.detail(id) })
      const previousDetail = queryClient.getQueryData<Teacher>(teacherKeys.detail(id))
      const queries = queryClient.getQueriesData<PaginatedResponse<Teacher>>({
        queryKey: teacherKeys.all,
      })
      const previousList = new Map(queries)
      if (previousDetail) {
        queryClient.setQueryData(teacherKeys.detail(id), { ...previousDetail, ...newData })
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
        queryClient.setQueryData(teacherKeys.detail(id), context.previousDetail)
      }
      if (context?.previousList) {
        for (const [key, data] of context.previousList) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: err.message })
    },
    onSuccess: () => {
      toast.success("Enseignant mis a jour")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all })
      queryClient.invalidateQueries({ queryKey: teacherKeys.detail(id) })
    },
  })
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => teachersApi.remove(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: teacherKeys.all })
      const queries = queryClient.getQueriesData<PaginatedResponse<Teacher>>({
        queryKey: teacherKeys.all,
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
      toast.success("Enseignant supprime")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all })
    },
  })
}
