"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { patsApi } from "@/lib/api/super-admin/pats"

export const patKeys = {
  all: ["super-admin", "pats"] as const,
  list: () => ["super-admin", "pats", "list"] as const,
}

export function usePatsList() {
  return useQuery({
    queryKey: patKeys.list(),
    queryFn: () => patsApi.list(),
    staleTime: 30_000,
  })
}

export function useCreatePat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: patsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patKeys.all })
    },
  })
}

export function useRevokePat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => patsApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patKeys.all })
    },
  })
}
