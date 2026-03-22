"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { subjectsApi } from "@/lib/api/subjects"
import type { Subject, SubjectCreate, SubjectUpdate, SubjectListParams } from "@/lib/contracts/subject"
import type { PaginatedResponse } from "@/lib/contracts"

export const subjectKeys = {
  all: ["subjects"] as const,
  list: (params: SubjectListParams) => ["subjects", "list", params] as const,
  detail: (id: number) => ["subjects", id] as const,
}

export function useSubjects(params: SubjectListParams = {}) {
  return useQuery({
    queryKey: subjectKeys.list(params),
    queryFn: () => subjectsApi.list(params),
    staleTime: 1000 * 60 * 5,
  })
}

export function useSubject(id: number) {
  return useQuery({
    queryKey: subjectKeys.detail(id),
    queryFn: () => subjectsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SubjectCreate) => subjectsApi.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: subjectKeys.all })
      const queries = queryClient.getQueriesData<PaginatedResponse<Subject>>({
        queryKey: subjectKeys.all,
      })
      const previous = new Map(queries)
      for (const [key, old] of queries) {
        if (!old) continue
        queryClient.setQueryData(key, {
          ...old,
          total: old.total + 1,
          data: [
            { ...newData, id: -Date.now(), created_at: "", updated_at: "" } as Subject,
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
      toast.success("Matiere creee avec succes")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all })
    },
  })
}

export function useUpdateSubject(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SubjectUpdate) => subjectsApi.update(id, data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: subjectKeys.all })
      await queryClient.cancelQueries({ queryKey: subjectKeys.detail(id) })
      const previousDetail = queryClient.getQueryData<Subject>(subjectKeys.detail(id))
      const queries = queryClient.getQueriesData<PaginatedResponse<Subject>>({
        queryKey: subjectKeys.all,
      })
      const previousList = new Map(queries)
      if (previousDetail) {
        queryClient.setQueryData(subjectKeys.detail(id), { ...previousDetail, ...newData })
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
        queryClient.setQueryData(subjectKeys.detail(id), context.previousDetail)
      }
      if (context?.previousList) {
        for (const [key, data] of context.previousList) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: err.message })
    },
    onSuccess: () => {
      toast.success("Matiere mise a jour")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all })
      queryClient.invalidateQueries({ queryKey: subjectKeys.detail(id) })
    },
  })
}

export function useDeleteSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => subjectsApi.remove(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: subjectKeys.all })
      const queries = queryClient.getQueriesData<PaginatedResponse<Subject>>({
        queryKey: subjectKeys.all,
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
      toast.success("Matiere supprimee")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all })
    },
  })
}
