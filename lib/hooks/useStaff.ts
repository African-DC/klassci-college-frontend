"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { staffApi } from "@/lib/api/staff"
import type { Staff, StaffCreate, StaffUpdate, StaffListParams } from "@/lib/contracts/staff"
import type { PaginatedResponse } from "@/lib/contracts"

export const staffKeys = {
  all: ["staff"] as const,
  list: (params: StaffListParams) => ["staff", "list", params] as const,
  detail: (id: number) => ["staff", id] as const,
}

export function useStaffList(params: StaffListParams = {}) {
  return useQuery({
    queryKey: staffKeys.list(params),
    queryFn: () => staffApi.list(params),
    staleTime: 1000 * 60 * 5,
  })
}

export function useStaffMember(id: number) {
  return useQuery({
    queryKey: staffKeys.detail(id),
    queryFn: () => staffApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StaffCreate) => staffApi.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: staffKeys.all })
      const queries = queryClient.getQueriesData<PaginatedResponse<Staff>>({
        queryKey: staffKeys.all,
      })
      const previous = new Map(queries)
      for (const [key, old] of queries) {
        if (!old) continue
        queryClient.setQueryData(key, {
          ...old,
          total: old.total + 1,
          data: [
            { ...newData, id: -Date.now(), created_at: "", updated_at: "" } as Staff,
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
      toast.success("Personnel cree avec succes")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
    },
  })
}

export function useUpdateStaff(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StaffUpdate) => staffApi.update(id, data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: staffKeys.all })
      await queryClient.cancelQueries({ queryKey: staffKeys.detail(id) })
      const previousDetail = queryClient.getQueryData<Staff>(staffKeys.detail(id))
      const queries = queryClient.getQueriesData<PaginatedResponse<Staff>>({
        queryKey: staffKeys.all,
      })
      const previousList = new Map(queries)
      if (previousDetail) {
        queryClient.setQueryData(staffKeys.detail(id), { ...previousDetail, ...newData })
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
        queryClient.setQueryData(staffKeys.detail(id), context.previousDetail)
      }
      if (context?.previousList) {
        for (const [key, data] of context.previousList) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: err.message })
    },
    onSuccess: () => {
      toast.success("Personnel mis a jour")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(id) })
    },
  })
}

export function useDeleteStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => staffApi.remove(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: staffKeys.all })
      const queries = queryClient.getQueriesData<PaginatedResponse<Staff>>({
        queryKey: staffKeys.all,
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
      toast.success("Personnel supprime")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
    },
  })
}
