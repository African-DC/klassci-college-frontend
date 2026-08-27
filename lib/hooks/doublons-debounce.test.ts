/**
 * La temporisation couvre-t-elle tous les champs qui entrent dans la clé ?
 *
 * C'est la clé de cache qui déclenche la requête : un seul champ non temporisé
 * qui y entre suffit à repartir à chaque touche, et la promesse du hook devient
 * fausse pour celui-là. La date et le lieu de naissance étaient dans ce cas.
 *
 * Le test exerce `useDoublons` lui-même. Une version antérieure appelait
 * `useDebounce` directement : elle restait verte même en retirant le câblage du
 * lieu de naissance, donc elle ne gardait rien.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import { act } from "react"
import type { ReactNode } from "react"
import { createElement } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useDoublons } from "./useDoublons"

function enveloppe() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  }
}

/** Les clés de requête présentes dans le cache, hors clés vides. */
function cles(client: QueryClient): string[] {
  return client
    .getQueryCache()
    .getAll()
    .map((q) => JSON.stringify(q.queryKey))
}

describe("la temporisation de la recherche de doublons", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("retient le lieu de naissance comme elle retient le nom", () => {
    const { client, wrapper } = enveloppe()
    const { rerender } = renderHook((p: { lieu: string }) =>
      useDoublons({ last_name: "KOUASSI", first_name: "Aya", birth_place: p.lieu }), {
      wrapper,
      initialProps: { lieu: "Boua" },
    })
    act(() => void vi.advanceTimersByTime(400))
    const avant = cles(client)

    // Une touche de plus dans le lieu de naissance.
    rerender({ lieu: "Bouak" })
    // Sans temporisation, une clé neuve apparaîtrait immédiatement.
    expect(cles(client)).toEqual(avant)

    act(() => void vi.advanceTimersByTime(400))
    expect(cles(client).length).toBeGreaterThan(avant.length)
  })

  it("ne part pas tant que la saisie est trop courte", () => {
    // « KO » remonterait la moitié de l'établissement.
    const { client, wrapper } = enveloppe()
    renderHook(() => useDoublons({ last_name: "KO" }), { wrapper })
    act(() => void vi.advanceTimersByTime(1000))
    expect(client.getQueryCache().getAll().filter((q) => q.state.fetchStatus !== "idle")).toHaveLength(0)
  })
})
