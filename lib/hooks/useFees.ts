"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { feesApi } from "@/lib/api/fees"
import type { FeeCategory, FeeCategoryCreate, FeeCategoryUpdate, FeeVariant, FeeVariantCreate, FeeVariantUpdate } from "@/lib/contracts/fee"

export const feeKeys = {
  all: ["fees"] as const,
  categories: ["fees", "categories"] as const,
  variants: (academicYearId?: number) => ["fees", "variants", academicYearId] as const,
}

// --- Catégories ---

export function useFeeCategories() {
  return useQuery({
    queryKey: feeKeys.categories,
    queryFn: () => feesApi.listCategories(),
    staleTime: 1000 * 60 * 10,
  })
}

export function useCreateFeeCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FeeCategoryCreate) => feesApi.createCategory(data),
    onSuccess: (created) => {
      toast.success("Catégorie créée")
      queryClient.setQueryData<FeeCategory[]>(feeKeys.categories, (old) =>
        old ? [...old, created] : [created],
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feeKeys.categories })
    },
    onError: (err) => toast.error("Erreur", { description: err.message }),
  })
}

export function useUpdateFeeCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FeeCategoryUpdate }) =>
      feesApi.updateCategory(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: feeKeys.categories })
      const previous = queryClient.getQueryData<FeeCategory[]>(feeKeys.categories)
      queryClient.setQueryData<FeeCategory[]>(feeKeys.categories, (old) =>
        old?.map((cat) => (cat.id === id ? { ...cat, ...data } : cat)),
      )
      return { previous }
    },
    onSuccess: () => toast.success("Catégorie mise à jour"),
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(feeKeys.categories, ctx.previous)
      toast.error("Erreur", { description: err.message })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: feeKeys.categories }),
  })
}

export function useDeleteFeeCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => feesApi.deleteCategory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: feeKeys.categories })
      const previous = queryClient.getQueryData<FeeCategory[]>(feeKeys.categories)
      queryClient.setQueryData<FeeCategory[]>(feeKeys.categories, (old) =>
        old?.filter((cat) => cat.id !== id),
      )
      return { previous }
    },
    onSuccess: () => toast.success("Catégorie supprimée"),
    onError: (err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(feeKeys.categories, ctx.previous)
      toast.error("Erreur", { description: err.message })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: feeKeys.categories }),
  })
}

// --- Variantes ---

export function useFeeVariants(academicYearId?: number) {
  return useQuery({
    queryKey: academicYearId ? feeKeys.variants(academicYearId) : ["fees", "variants", "none"],
    queryFn: () => feesApi.listVariants(academicYearId as number),
    enabled: !!academicYearId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useCreateFeeVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FeeVariantCreate) => feesApi.createVariant(data),
    onSuccess: () => {
      toast.success("Variante créée")
      queryClient.invalidateQueries({ queryKey: feeKeys.all })
    },
    onError: (err) => toast.error("Erreur", { description: err.message }),
  })
}

export function useUpdateFeeVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FeeVariantUpdate }) =>
      feesApi.updateVariant(id, data),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: feeKeys.all })
      // Snapshot de toutes les listes de variantes pour rollback
      const snapshots = queryClient.getQueriesData<FeeVariant[]>({ queryKey: ["fees", "variants"] })
      return { snapshots }
    },
    onSuccess: () => toast.success("Variante mise à jour"),
    onError: (err, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, data)
      })
      toast.error("Erreur", { description: err.message })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["fees", "variants"] }),
  })
}

export function useDeleteFeeVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => feesApi.deleteVariant(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: feeKeys.all })
      const snapshots = queryClient.getQueriesData<FeeVariant[]>({ queryKey: ["fees", "variants"] })
      return { snapshots }
    },
    onSuccess: () => toast.success("Variante supprimée"),
    onError: (err, _id, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, data)
      })
      toast.error("Erreur", { description: err.message })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["fees", "variants"] }),
  })
}
