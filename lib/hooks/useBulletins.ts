"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { bulletinsApi } from "@/lib/api/bulletins"
import type { BulletinListParams, BulletinGenerate } from "@/lib/contracts/bulletin"

export const bulletinKeys = {
  all: ["bulletins"] as const,
  list: (params: BulletinListParams) => ["bulletins", "list", params] as const,
  detail: (id: number) => ["bulletins", id] as const,
}

export function useBulletins(params: BulletinListParams = {}) {
  return useQuery({
    queryKey: bulletinKeys.list(params),
    queryFn: () => bulletinsApi.list(params),
    staleTime: 1000 * 60 * 5,
  })
}

export function useBulletin(id: number | null) {
  return useQuery({
    queryKey: id ? bulletinKeys.detail(id) : ["bulletins", "none"],
    queryFn: () => bulletinsApi.getById(id as number),
    enabled: id !== null && id > 0,
    staleTime: 1000 * 60 * 5,
  })
}

export function useGenerateBulletins() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BulletinGenerate) => bulletinsApi.generate(data),
    onSuccess: (result) => {
      toast.success(`${result.generated} bulletin(s) généré(s) avec succès`)
      queryClient.invalidateQueries({ queryKey: bulletinKeys.all })
    },
    onError: (err) => {
      toast.error("Erreur", { description: err.message })
    },
  })
}

export function usePublishBulletins() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      classId,
      trimester,
      academicYearId,
    }: {
      classId: number
      trimester: number
      academicYearId: number
    }) => bulletinsApi.publish(classId, trimester, academicYearId),
    onSuccess: (result) => {
      toast.success(`${result.count} bulletin(s) publié(s)`)
      queryClient.invalidateQueries({ queryKey: bulletinKeys.all })
    },
    onError: (err) => {
      toast.error("Erreur", { description: err.message })
    },
  })
}
