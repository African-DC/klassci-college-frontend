/**
 * Ce que le hook garantit et qui n'était gardé par rien.
 *
 * Il existe parce que les trois écrans portaient chacun leur copie du même
 * branchement et avaient déjà divergé : celui de création d'élève ne passait
 * pas l'année scolaire, donc « cet élève a déjà un dossier ouvert cette
 * année » — le signal pour lequel la fonctionnalité a été écrite — n'y
 * apparaissait jamais. Rien ne l'empêchait de recommencer.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import { act } from "react"
import type { ReactNode } from "react"
import { createElement } from "react"
import { useForm } from "react-hook-form"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useDoublonsFormulaire } from "./useDoublonsFormulaire"

vi.mock("./useCurrentAcademicYear", () => ({
  useCurrentAcademicYearId: () => ({ academicYearId: 7, years: [], isLoading: false }),
}))

function enveloppe() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  }
}

interface Champs {
  last_name?: string | null
  first_name?: string | null
  birth_date?: string | null
  enrollment_number?: string | null
}

describe("le branchement du signalement sur un formulaire", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("passe toujours l'année scolaire, sans que l'écran ait à y penser", () => {
    const { client, wrapper } = enveloppe()
    renderHook(
      () => {
        const form = useForm<Champs>({
          defaultValues: { last_name: "KOUASSI", first_name: "Aya" },
        })
        return useDoublonsFormulaire(form)
      },
      { wrapper },
    )
    act(() => void vi.advanceTimersByTime(400))

    const cles = client.getQueryCache().getAll().map((q) => JSON.stringify(q.queryKey))
    expect(cles.some((c) => c.includes('"academic_year_id":7'))).toBe(true)
  })

  it("ne part pas sur le nom seul", () => {
    // Le serveur refuse ce cas : l'envoyer coûterait un aller-retour pour rien
    // sur la connexion d'une école.
    const { client, wrapper } = enveloppe()
    renderHook(
      () => {
        const form = useForm<Champs>({ defaultValues: { last_name: "KOUASSI" } })
        return useDoublonsFormulaire(form)
      },
      { wrapper },
    )
    act(() => void vi.advanceTimersByTime(1000))
    expect(
      client.getQueryCache().getAll().filter((q) => q.state.fetchStatus !== "idle"),
    ).toHaveLength(0)
  })
})
