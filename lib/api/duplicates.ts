import { DuplicatesSchema } from "@/lib/contracts/duplicates"
import type { Duplicates, DuplicatesParams } from "@/lib/contracts/duplicates"
import { apiFetch, safeValidate } from "./client"

export const duplicatesApi = {
  /**
   * Les fiches qui pourraient déjà être cet élève.
   *
   * Ne modifie rien : c'est une lecture, appelée pendant la typed.
   */
  async search(params: DuplicatesParams): Promise<Duplicates> {
    const query = new URLSearchParams()
    for (const [cle, valeur] of Object.entries(params)) {
      if (valeur === undefined || valeur === null || valeur === "") continue
      query.set(cle, String(valeur))
    }
    const brut = await apiFetch<unknown>(`/admin/students/duplicates?${query.toString()}`)
    return safeValidate(DuplicatesSchema, brut, "duplicatesApi.search")
  },
}
