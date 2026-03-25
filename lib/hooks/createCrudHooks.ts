"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { CrudApi } from "@/lib/api/createCrudApi"
import type { PaginatedResponse } from "@/lib/contracts"

interface CrudLabels {
  created: string
  updated: string
  deleted: string
  errorFallback: string
}

export function createCrudHooks<
  T extends { id: number },
  TCreate,
  TUpdate,
>(
  resourceKey: string,
  api: CrudApi<T, TCreate, TUpdate>,
  labels: CrudLabels,
) {
  const keys = {
    all: [resourceKey] as const,
    list: (params: Record<string, unknown>) => [resourceKey, "list", params] as const,
    detail: (id: number) => [resourceKey, id] as const,
  }

  function useList(params: Record<string, unknown> = {}) {
    return useQuery({
      queryKey: keys.list(params),
      queryFn: () => api.list(params),
      staleTime: 1000 * 60 * 5,
    })
  }

  function useDetail(id: number) {
    return useQuery({
      queryKey: keys.detail(id),
      queryFn: () => api.getById(id),
      enabled: !!id,
    })
  }

  function useCreate() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (data: TCreate) => api.create(data),
      onMutate: async (newData) => {
        await queryClient.cancelQueries({ queryKey: keys.all })
        const queries = queryClient.getQueriesData<PaginatedResponse<T>>({
          queryKey: keys.all,
        })
        const previous = new Map(queries)
        for (const [key, old] of queries) {
          if (!old) continue
          queryClient.setQueryData(key, {
            ...old,
            total: old.total + 1,
            data: [
              { ...newData, id: -Date.now(), created_at: "", updated_at: "" } as unknown as T,
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
        toast.success(labels.created)
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: keys.all })
      },
    })
  }

  function useUpdate(id: number) {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (data: TUpdate) => api.update(id, data),
      onMutate: async (newData) => {
        await queryClient.cancelQueries({ queryKey: keys.all })
        await queryClient.cancelQueries({ queryKey: keys.detail(id) })
        const previousDetail = queryClient.getQueryData<T>(keys.detail(id))
        const queries = queryClient.getQueriesData<PaginatedResponse<T>>({
          queryKey: keys.all,
        })
        const previousList = new Map(queries)
        if (previousDetail) {
          queryClient.setQueryData(keys.detail(id), { ...previousDetail, ...newData })
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
          queryClient.setQueryData(keys.detail(id), context.previousDetail)
        }
        if (context?.previousList) {
          for (const [key, data] of context.previousList) {
            queryClient.setQueryData(key, data)
          }
        }
        toast.error("Erreur", { description: err.message })
      },
      onSuccess: () => {
        toast.success(labels.updated)
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: keys.all })
        queryClient.invalidateQueries({ queryKey: keys.detail(id) })
      },
    })
  }

  function useDelete() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: number) => api.remove(id),
      onMutate: async (deletedId) => {
        await queryClient.cancelQueries({ queryKey: keys.all })
        const queries = queryClient.getQueriesData<PaginatedResponse<T>>({
          queryKey: keys.all,
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
        toast.success(labels.deleted)
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: keys.all })
      },
    })
  }

  return { keys, useList, useDetail, useCreate, useUpdate, useDelete }
}
