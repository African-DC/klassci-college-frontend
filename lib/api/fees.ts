import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  FeeCategorySchema,
  FeeVariantSchema,
  OptionalFeeOptionSchema,
  type FeeCategory,
  type FeeVariant,
  type OptionalFeeOption,
  type FeeCategoryCreate,
  type FeeCategoryUpdate,
  type FeeVariantCreate,
  type FeeVariantUpdate,
  type OptionalFeeOptionCreate,
  type OptionalFeeOptionUpdate,
} from "@/lib/contracts/fee"

const FeeCategoryArraySchema = z.array(FeeCategorySchema)
const FeeVariantArraySchema = z.array(FeeVariantSchema)
const OptionalFeeOptionArraySchema = z.array(OptionalFeeOptionSchema)

export const feesApi = {
  // --- Catégories de frais ---

  listCategories: async (): Promise<FeeCategory[]> => {
    const json = await apiFetch<{ items?: FeeCategory[]; data?: FeeCategory[] } | FeeCategory[]>("/admin/fee-categories")
    const arr = Array.isArray(json) ? json : (json as { items?: FeeCategory[]; data?: FeeCategory[] }).items ?? (json as { data?: FeeCategory[] }).data ?? []
    return safeValidate(FeeCategoryArraySchema, arr, "GET /admin/fee-categories")
  },

  createCategory: async (data: FeeCategoryCreate): Promise<FeeCategory> => {
    const json = await apiFetch<{ data?: FeeCategory } | FeeCategory>("/admin/fee-categories", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const category = (json as { data?: FeeCategory }).data ?? (json as FeeCategory)
    return safeValidate(FeeCategorySchema, category, "POST /admin/fee-categories")
  },

  updateCategory: async (id: number, data: FeeCategoryUpdate): Promise<FeeCategory> => {
    const json = await apiFetch<{ data?: FeeCategory } | FeeCategory>(`/admin/fee-categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    const category = (json as { data?: FeeCategory }).data ?? (json as FeeCategory)
    return safeValidate(FeeCategorySchema, category, `PATCH /admin/fee-categories/${id}`)
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiFetch(`/admin/fee-categories/${id}`, { method: "DELETE" })
  },

  // --- Variantes de frais ---

  listVariants: async (academicYearId?: number): Promise<FeeVariant[]> => {
    const query = academicYearId ? `?academic_year_id=${academicYearId}` : ""
    const json = await apiFetch<{ items?: FeeVariant[]; data?: FeeVariant[] } | FeeVariant[]>(`/admin/fee-variants${query}`)
    const arr = Array.isArray(json) ? json : (json as { items?: FeeVariant[]; data?: FeeVariant[] }).items ?? (json as { data?: FeeVariant[] }).data ?? []
    return safeValidate(FeeVariantArraySchema, arr, "GET /admin/fee-variants")
  },

  createVariant: async (data: FeeVariantCreate): Promise<FeeVariant> => {
    const json = await apiFetch<{ data?: FeeVariant } | FeeVariant>("/admin/fee-variants", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const variant = (json as { data?: FeeVariant }).data ?? (json as FeeVariant)
    return safeValidate(FeeVariantSchema, variant, "POST /admin/fee-variants")
  },

  updateVariant: async (id: number, data: FeeVariantUpdate): Promise<FeeVariant> => {
    const json = await apiFetch<{ data?: FeeVariant } | FeeVariant>(`/admin/fee-variants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    const variant = (json as { data?: FeeVariant }).data ?? (json as FeeVariant)
    return safeValidate(FeeVariantSchema, variant, `PATCH /admin/fee-variants/${id}`)
  },

  deleteVariant: async (id: number): Promise<void> => {
    await apiFetch(`/admin/fee-variants/${id}`, { method: "DELETE" })
  },

  // --- Options de frais optionnels ---

  listOptions: async (categoryId: number, academicYearId?: number): Promise<OptionalFeeOption[]> => {
    const params = new URLSearchParams({ category_id: String(categoryId) })
    if (academicYearId) params.set("academic_year_id", String(academicYearId))
    const json = await apiFetch<{ items?: OptionalFeeOption[] } | OptionalFeeOption[]>(`/admin/fee-options?${params}`)
    const arr = Array.isArray(json) ? json : (json as { items?: OptionalFeeOption[] }).items ?? []
    return safeValidate(OptionalFeeOptionArraySchema, arr, "GET /admin/fee-options")
  },

  createOption: async (data: OptionalFeeOptionCreate): Promise<OptionalFeeOption> => {
    const json = await apiFetch<{ data?: OptionalFeeOption } | OptionalFeeOption>("/admin/fee-options", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const option = (json as { data?: OptionalFeeOption }).data ?? (json as OptionalFeeOption)
    return safeValidate(OptionalFeeOptionSchema, option, "POST /admin/fee-options")
  },

  updateOption: async (id: number, data: OptionalFeeOptionUpdate): Promise<OptionalFeeOption> => {
    const json = await apiFetch<{ data?: OptionalFeeOption } | OptionalFeeOption>(`/admin/fee-options/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    const option = (json as { data?: OptionalFeeOption }).data ?? (json as OptionalFeeOption)
    return safeValidate(OptionalFeeOptionSchema, option, `PATCH /admin/fee-options/${id}`)
  },

  deleteOption: async (id: number): Promise<void> => {
    await apiFetch(`/admin/fee-options/${id}`, { method: "DELETE" })
  },
}
