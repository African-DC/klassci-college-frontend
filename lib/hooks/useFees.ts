"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { feesApi } from "@/lib/api/fees"
import type { FeeCategoryCreate, FeeCategoryUpdate, FeeVariantCreate, FeeVariantUpdate } from "@/lib/contracts/fee"

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
    onSuccess: () => {
      toast.success("Catégorie créée")
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
    onSuccess: () => {
      toast.success("Catégorie mise à jour")
      queryClient.invalidateQueries({ queryKey: feeKeys.categories })
    },
    onError: (err) => toast.error("Erreur", { description: err.message }),
  })
}

export function useDeleteFeeCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => feesApi.deleteCategory(id),
    onSuccess: () => {
      toast.success("Catégorie supprimée")
      queryClient.invalidateQueries({ queryKey: feeKeys.categories })
    },
    onError: (err) => toast.error("Erreur", { description: err.message }),
  })
}

// --- Variantes ---

export function useFeeVariants(academicYearId?: number) {
  return useQuery({
    queryKey: feeKeys.variants(academicYearId),
    queryFn: () => feesApi.listVariants(academicYearId!),
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
    onSuccess: () => {
      toast.success("Variante mise à jour")
      queryClient.invalidateQueries({ queryKey: feeKeys.all })
    },
    onError: (err) => toast.error("Erreur", { description: err.message }),
  })
}

export function useDeleteFeeVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => feesApi.deleteVariant(id),
    onSuccess: () => {
      toast.success("Variante supprimée")
      queryClient.invalidateQueries({ queryKey: feeKeys.all })
    },
    onError: (err) => toast.error("Erreur", { description: err.message }),
  })
}
