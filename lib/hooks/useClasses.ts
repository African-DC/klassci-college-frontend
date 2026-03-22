"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { classesApi } from "@/lib/api/classes"
import type { Class, ClassCreate, ClassUpdate, ClassListParams } from "@/lib/contracts/class"
import type { PaginatedResponse } from "@/lib/contracts"

export const classKeys = {
  all: ["classes"] as const,
  list: (params: ClassListParams) => ["classes", "list", params] as const,
  detail: (id: number) => ["classes", id] as const,
}

export function useClasses(params: ClassListParams = {}) {
  return useQuery({
    queryKey: classKeys.list(params),
    queryFn: () => classesApi.list(params),
    staleTime: 1000 * 60 * 5,
  })
}

export function useClass(id: number) {
  return useQuery({
    queryKey: classKeys.detail(id),
    queryFn: () => classesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ClassCreate) => classesApi.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: classKeys.all })
      const queries = queryClient.getQueriesData<PaginatedResponse<Class>>({
        queryKey: classKeys.all,
      })
      const previous = new Map(queries)
      for (const [key, old] of queries) {
        if (!old) continue
        queryClient.setQueryData(key, {
          ...old,
          total: old.total + 1,
          data: [
            { ...newData, id: -Date.now(), created_at: "", updated_at: "" } as Class,
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
      toast.success("Classe creee avec succes")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all })
    },
  })
}

export function useUpdateClass(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ClassUpdate) => classesApi.update(id, data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: classKeys.all })
      await queryClient.cancelQueries({ queryKey: classKeys.detail(id) })
      const previousDetail = queryClient.getQueryData<Class>(classKeys.detail(id))
      const queries = queryClient.getQueriesData<PaginatedResponse<Class>>({
        queryKey: classKeys.all,
      })
      const previousList = new Map(queries)
      if (previousDetail) {
        queryClient.setQueryData(classKeys.detail(id), { ...previousDetail, ...newData })
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
        queryClient.setQueryData(classKeys.detail(id), context.previousDetail)
      }
      if (context?.previousList) {
        for (const [key, data] of context.previousList) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: err.message })
    },
    onSuccess: () => {
      toast.success("Classe mise a jour")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all })
      queryClient.invalidateQueries({ queryKey: classKeys.detail(id) })
    },
  })
}

export function useDeleteClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => classesApi.remove(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: classKeys.all })
      const queries = queryClient.getQueriesData<PaginatedResponse<Class>>({
        queryKey: classKeys.all,
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
      toast.success("Classe supprimee")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all })
    },
  })
}
