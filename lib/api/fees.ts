import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  FeeCategorySchema,
  FeeVariantSchema,
  type FeeCategory,
  type FeeVariant,
  type FeeCategoryCreate,
  type FeeCategoryUpdate,
  type FeeVariantCreate,
  type FeeVariantUpdate,
} from "@/lib/contracts/fee"

const FeeCategoryArraySchema = z.array(FeeCategorySchema)
const FeeVariantArraySchema = z.array(FeeVariantSchema)

export const feesApi = {
  // --- Catégories de frais ---

  listCategories: async (): Promise<FeeCategory[]> => {
    const json = await apiFetch<{ data?: FeeCategory[] } | FeeCategory[]>("/fee-categories")
    const arr = Array.isArray(json) ? json : (json as { data?: FeeCategory[] }).data ?? []
    return safeValidate(FeeCategoryArraySchema, arr, "GET /fee-categories")
  },

  createCategory: async (data: FeeCategoryCreate): Promise<FeeCategory> => {
    const json = await apiFetch<{ data?: FeeCategory } | FeeCategory>("/fee-categories", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const category = (json as { data?: FeeCategory }).data ?? (json as FeeCategory)
    return safeValidate(FeeCategorySchema, category, "POST /fee-categories")
  },

  updateCategory: async (id: number, data: FeeCategoryUpdate): Promise<FeeCategory> => {
    const json = await apiFetch<{ data?: FeeCategory } | FeeCategory>(`/fee-categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    const category = (json as { data?: FeeCategory }).data ?? (json as FeeCategory)
    return safeValidate(FeeCategorySchema, category, `PATCH /fee-categories/${id}`)
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiFetch(`/fee-categories/${id}`, { method: "DELETE" })
  },

  // --- Variantes de frais ---

  listVariants: async (academicYearId?: number): Promise<FeeVariant[]> => {
    const query = academicYearId ? `?academic_year_id=${academicYearId}` : ""
    const json = await apiFetch<{ data?: FeeVariant[] } | FeeVariant[]>(`/fee-variants${query}`)
    const arr = Array.isArray(json) ? json : (json as { data?: FeeVariant[] }).data ?? []
    return safeValidate(FeeVariantArraySchema, arr, "GET /fee-variants")
  },

  createVariant: async (data: FeeVariantCreate): Promise<FeeVariant> => {
    const json = await apiFetch<{ data?: FeeVariant } | FeeVariant>("/fee-variants", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const variant = (json as { data?: FeeVariant }).data ?? (json as FeeVariant)
    return safeValidate(FeeVariantSchema, variant, "POST /fee-variants")
  },

  updateVariant: async (id: number, data: FeeVariantUpdate): Promise<FeeVariant> => {
    const json = await apiFetch<{ data?: FeeVariant } | FeeVariant>(`/fee-variants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    const variant = (json as { data?: FeeVariant }).data ?? (json as FeeVariant)
    return safeValidate(FeeVariantSchema, variant, `PATCH /fee-variants/${id}`)
  },

  deleteVariant: async (id: number): Promise<void> => {
    await apiFetch(`/fee-variants/${id}`, { method: "DELETE" })
  },
}
