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
import {
  FeePropagationPreviewSchema,
  FeePropagationResultSchema,
  type FeePropagationPreview,
  type FeePropagationResult,
} from "@/lib/contracts/fee-propagation"
import {
  MandatoryBasketSchema,
  type MandatoryBasket,
} from "@/lib/contracts/fee-audience"

const FeeCategoryArraySchema = z.array(FeeCategorySchema)
const FeeVariantArraySchema = z.array(FeeVariantSchema)
const OptionalFeeOptionArraySchema = z.array(OptionalFeeOptionSchema)

/**
 * Ramène TOUTES les pages d'une liste paginée.
 *
 * Le backend renvoie 20 éléments par défaut et plafonne à 100. Une grille de
 * frais qui n'affiche que la première page ne se signale pas : elle montre des
 * niveaux avec moins de lignes qu'ils n'en portent, et le total par élève est
 * faux. C'est arrivé en production sur une école de sept niveaux, où les frais
 * d'inscription de quatre niveaux étaient invisibles alors qu'ils existaient
 * bel et bien, si bien que les recréer se soldait par « doublon possible ».
 */
async function fetchEveryPage<T>(path: string, params: URLSearchParams): Promise<T[]> {
  const MAX_SIZE = 100
  const tout: T[] = []
  let page = 1

  for (;;) {
    params.set("page", String(page))
    params.set("size", String(MAX_SIZE))
    const json = await apiFetch<{ items?: T[]; data?: T[]; total?: number } | T[]>(
      `${path}?${params.toString()}`,
    )

    if (Array.isArray(json)) return json // le point d'entrée ne pagine pas

    const lot = json.items ?? json.data ?? []
    tout.push(...lot)

    const total = json.total
    // S'arrêter sur une page incomplète autant que sur le total : si le
    // backend cessait un jour de renvoyer `total`, la boucle doit finir quand
    // même plutôt que de tourner sans fin.
    if (lot.length < MAX_SIZE || (typeof total === "number" && tout.length >= total)) break
    page += 1
  }

  return tout
}

export const feesApi = {
  // --- Catégories de frais ---

  listCategories: async (): Promise<FeeCategory[]> => {
    const arr = await fetchEveryPage<FeeCategory>("/admin/fee-categories", new URLSearchParams())
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
    const params = new URLSearchParams()
    if (academicYearId) params.set("academic_year_id", String(academicYearId))
    const arr = await fetchEveryPage<FeeVariant>("/admin/fee-variants", params)
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

  // --- Repercussion d'un tarif sur les inscriptions existantes ---

  /**
   * Ce que la repercussion ferait, sans rien ecrire.
   *
   * Se lit avant de decider : l'ecole doit voir combien d'inscriptions sont
   * touchees et de combien la dette bougerait AVANT de confirmer.
   */
  /**
   * Le socle obligatoire de chaque niveau, pour chacun des six publics.
   *
   * Toutes les combinaisons d'un coup : l'ecran bascule entre publics pendant
   * que la personne reflechit, et un aller-retour par bascule la ferait
   * attendre sur une connexion instable. C'est le serveur qui arbitre quel
   * tarif l'emporte, la ou l'ecran le refaisait en divergeant.
   */
  mandatoryBasket: async (academicYearId: number): Promise<MandatoryBasket> => {
    const path = `/admin/fee-variants/mandatory-basket?academic_year_id=${academicYearId}`
    const json = await apiFetch<unknown>(path)
    return safeValidate(MandatoryBasketSchema, json, "GET /admin/fee-variants/mandatory-basket")
  },

  propagationPreview: async (id: number): Promise<FeePropagationPreview> => {
    const json = await apiFetch<unknown>(`/admin/fee-variants/${id}/propagation-preview`)
    return safeValidate(
      FeePropagationPreviewSchema,
      json,
      `GET /admin/fee-variants/${id}/propagation-preview`,
    )
  },

  /**
   * Applique la repercussion. Rend le decompte des lignes reellement reecrites.
   *
   * `create_missing` part TOUJOURS dans le corps, meme a `false` :
   * `JSON.stringify` supprime les cles `undefined`, et un champ disparu
   * laisserait le serveur decider a la place de l'ecole. Repercuter des
   * montants et creer des lignes manquantes sont deux gestes distincts, le
   * second ne s'obtient qu'en le demandant.
   */
  propagate: async (
    id: number,
    options?: { createMissing?: boolean },
  ): Promise<FeePropagationResult> => {
    const json = await apiFetch<unknown>(`/admin/fee-variants/${id}/propagate`, {
      method: "POST",
      body: JSON.stringify({ create_missing: options?.createMissing ?? false }),
    })
    return safeValidate(
      FeePropagationResultSchema,
      json,
      `POST /admin/fee-variants/${id}/propagate`,
    )
  },

  // --- Options de frais optionnels ---

  listOptions: async (categoryId: number, academicYearId?: number): Promise<OptionalFeeOption[]> => {
    const params = new URLSearchParams({ category_id: String(categoryId) })
    if (academicYearId) params.set("academic_year_id", String(academicYearId))
    const arr = await fetchEveryPage<OptionalFeeOption>("/admin/fee-options", params)
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
