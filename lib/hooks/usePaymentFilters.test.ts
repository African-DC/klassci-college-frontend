/**
 * Les filtres décident de ce que le serveur renvoie : ils se testent.
 *
 * Ces sept états vivaient dispersés dans la page, avec la construction des
 * paramètres à un endroit, le compte des filtres actifs à un autre et la
 * réinitialisation à un troisième. Réunis, ils deviennent vérifiables — et
 * c'est la construction des paramètres qui compte, puisqu'une clé oubliée ne
 * casse rien à l'écran : elle renvoie simplement les mauvais versements.
 */

import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { usePaymentFilters } from "./usePaymentFilters"

afterEach(() => { vi.useRealTimers() })

describe("les filtres du journal des versements", () => {
  it("ne demande rien au serveur tant qu'on n'a rien choisi", () => {
    const { result } = renderHook(() => usePaymentFilters())
    expect(result.current.params).toEqual({})
    expect(result.current.activeCount).toBe(0)
  })

  it("borne la période sur la journée entière, pas sur minuit", () => {
    // Sans les heures, « au 21 août » exclurait tout ce qui a été encaissé ce jour-là.
    const { result } = renderHook(() => usePaymentFilters())
    act(() => { result.current.set("dateFrom", "2026-08-21") })
    act(() => { result.current.set("dateTo", "2026-08-21") })
    expect(result.current.params).toMatchObject({
      date_from: "2026-08-21T00:00:00",
      date_to: "2026-08-21T23:59:59",
    })
  })

  it("convertit en nombre ce que les listes déroulantes rendent en texte", () => {
    const { result } = renderHook(() => usePaymentFilters())
    act(() => { result.current.set("category", "7") })
    act(() => { result.current.set("cashier", "55") })
    expect(result.current.params).toMatchObject({ fee_category_id: 7, received_by: 55 })
  })

  it("envoie la recherche au serveur, une fois la frappe terminée", () => {
    // La recherche est le seul filtre qui passe par un debounce : son câblage
    // differe de celui des six autres, donc c'est le seul qu'un test de
    // « le filtre arrive-t-il dans les paramètres ? » pouvait manquer.
    vi.useFakeTimers()
    const { result } = renderHook(() => usePaymentFilters())
    act(() => { result.current.set("search", "Aminata") })
    expect(result.current.params).toEqual({})
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.params).toMatchObject({ search: "Aminata" })
  })

  it("retire la clé des paramètres quand on revient à « tous »", () => {
    // « Tous les statuts » passe undefined : il doit effacer la clé, pas
    // envoyer status=undefined au serveur.
    const { result } = renderHook(() => usePaymentFilters())
    act(() => { result.current.set("status", "completed") })
    expect(result.current.params).toHaveProperty("status")
    act(() => { result.current.set("status", undefined) })
    expect(result.current.params).toEqual({})
  })

  it("ne compte pas la recherche parmi les filtres actifs", () => {
    // Elle a son propre champ, visible et effaçable : l'ajouter au compteur
    // ferait clignoter « Réinitialiser (1) » à la première lettre tapée.
    const { result } = renderHook(() => usePaymentFilters())
    act(() => { result.current.set("search", "Aminata") })
    expect(result.current.activeCount).toBe(0)
    act(() => { result.current.set("status", "cancelled") })
    expect(result.current.activeCount).toBe(1)
  })

  it("modifie un filtre sans effacer les autres", () => {
    const { result } = renderHook(() => usePaymentFilters())
    act(() => { result.current.set("status", "completed") })
    act(() => { result.current.set("method", "cash") })
    expect(result.current.params).toMatchObject({ status: "completed", method: "cash" })
  })

  it("remet tout à zéro d'un seul geste", () => {
    const { result } = renderHook(() => usePaymentFilters())
    act(() => { result.current.set("status", "completed") })
    act(() => { result.current.set("dateFrom", "2026-08-01") })
    act(() => { result.current.reset() })
    expect(result.current.params).toEqual({})
    expect(result.current.activeCount).toBe(0)
    expect(result.current.filters.search).toBe("")
  })
})
