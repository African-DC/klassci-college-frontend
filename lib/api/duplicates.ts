import { DoublonsSchema } from "@/lib/contracts/duplicates"
import type { Doublons, DoublonsParams } from "@/lib/contracts/duplicates"
import { apiFetch, safeValidate } from "./client"

export const duplicatesApi = {
  /**
   * Les fiches qui pourraient déjà être cet élève.
   *
   * Ne modifie rien : c'est une lecture, appelée pendant la saisie.
   */
  async chercher(params: DoublonsParams): Promise<Doublons> {
    const query = new URLSearchParams()
    for (const [cle, valeur] of Object.entries(params)) {
      if (valeur === undefined || valeur === null || valeur === "") continue
      query.set(cle, String(valeur))
    }
    const brut = await apiFetch<unknown>(`/admin/students/doublons?${query.toString()}`)
    return safeValidate(DoublonsSchema, brut, "duplicatesApi.chercher")
  },
}
