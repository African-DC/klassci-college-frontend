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
import { useFormDuplicates } from "./useFormDuplicates"
import type { Match } from "@/lib/contracts/duplicates"

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
        return useFormDuplicates(form)
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
        return useFormDuplicates(form)
      },
      { wrapper },
    )
    act(() => void vi.advanceTimersByTime(1000))
    expect(
      client.getQueryCache().getAll().filter((q) => q.state.fetchStatus !== "idle"),
    ).toHaveLength(0)
  })
})

describe("ce que le hook rend, et pas seulement ce qu'il demande", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  /**
   * Les deux tests ci-dessus n'observent que les clés de cache. Chacune des
   * quatre valeurs rendues pouvait donc être remplacée par une constante sans
   * qu'un test bouge — dont `truncated`, le signal qu'une passe de revue venait
   * de rattraper dans le composant, et `failed`, qui empêche une vérification
   * ratée de passer pour un feu vert.
   */
  function monter(reponse: unknown, options?: { excludeStudentId?: number }) {
    const { client, wrapper } = enveloppe()
    const rendu = renderHook(
      () => {
        const form = useForm<Champs>({
          defaultValues: { last_name: "KOUASSI", first_name: "Aya" },
        })
        return useFormDuplicates(form, options)
      },
      { wrapper },
    )
    act(() => void vi.advanceTimersByTime(400))
    const cle = client.getQueryCache().getAll()[0]?.queryKey
    if (cle) act(() => void client.setQueryData(cle, reponse))
    // Le cache est semé après le premier rendu : sans ce nouveau rendu, le
    // hook renvoie encore son état initial.
    act(() => rendu.rerender())
    return rendu
  }

  // Annotée : sans le type, `monter(reponse: unknown)` blanchissait une
  // valeur hors énumération et la fixture mentait sur le contrat.
  const match: Match = {
    student_id: 112,
    last_name: "KOUASSI",
    first_name: "Aya",
    enrollment_number: "ECER0882",
    birth_date: null,
    reason: "similarity" as const,
    score: 0.94,
    partial_identity: true,
    current_year_enrollment: null,
  }

  it("transmet les matches reçues", () => {
    const { result } = monter({ matches: [match], truncated: false })
    expect(result.current.matches).toHaveLength(1)
    expect(result.current.matches[0].enrollment_number).toBe("ECER0882")
  })

  it("transmet la troncature", () => {
    const { result } = monter({ matches: [], truncated: true })
    expect(result.current.truncated).toBe(true)
  })

  it("passe l'élève à ignorer, pour qu'une fiche ne se signale pas elle-même", () => {
    const { client, wrapper } = enveloppe()
    renderHook(
      () => {
        const form = useForm<Champs>({
          defaultValues: { last_name: "KOUASSI", first_name: "Aya" },
        })
        return useFormDuplicates(form, { excludeStudentId: 42 })
      },
      { wrapper },
    )
    act(() => void vi.advanceTimersByTime(400))
    const cles = client.getQueryCache().getAll().map((q) => JSON.stringify(q.queryKey))
    expect(cles.some((c) => c.includes('"exclude_student_id":42'))).toBe(true)
  })
})

describe("l'échec doit remonter jusqu'à l'écran", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("rend `failed` quand la requête a échoué", async () => {
    // Sans cette remontée, une vérification ratée se tait, et le silence de
    // l'écran veut dire « rien trouvé ». C'est le seul résultat que toute la
    // conception cherche à empêcher.
    vi.useRealTimers()
    const { client, wrapper } = enveloppe()
    const { result } = renderHook(
      () => {
        const form = useForm<Champs>({
          defaultValues: { last_name: "KOUASSI", first_name: "Aya" },
        })
        return useFormDuplicates(form)
      },
      { wrapper },
    )

    await vi.waitFor(() => expect(client.getQueryCache().getAll().length).toBeGreaterThan(0))
    const query = client.getQueryCache().getAll()[0]
    act(() => {
      query.setState({ ...query.state, status: "error", error: new Error("réseau"), fetchStatus: "idle" })
    })
    await vi.waitFor(() => expect(result.current.failed).toBe(true))
  })
})

describe("les deux dernières garanties du hook", () => {
  it("rend `pending` pendant la requête", async () => {
    // Sans cela, les 400 ms de temporisation plus l'aller-retour se lisent
    // comme « aucun doublon » sur la connexion d'une école.
    vi.useRealTimers()
    const { client, wrapper } = enveloppe()
    const { result } = renderHook(
      () => {
        const form = useForm<Champs>({
          defaultValues: { last_name: "KOUASSI", first_name: "Aya" },
        })
        return useFormDuplicates(form)
      },
      { wrapper },
    )
    await vi.waitFor(() => expect(client.getQueryCache().getAll().length).toBeGreaterThan(0))
    const query = client.getQueryCache().getAll()[0]
    act(() => query.setState({ ...query.state, fetchStatus: "fetching" }))
    await vi.waitFor(() => expect(result.current.pending).toBe(true))
  })

  it("envoie chaque champ surveillé dans le bon paramètre", () => {
    // Le tableau des noms et la destructuration sont côte à côte pour que le
    // décalage se voie ; ce test le rend impossible.
    vi.useFakeTimers()
    const { client, wrapper } = enveloppe()
    renderHook(
      () => {
        const form = useForm<Champs>({
          defaultValues: {
            last_name: "KOUASSI",
            first_name: "Aya",
            birth_date: "2010-03-14",
            enrollment_number: "ECER0882",
          },
        })
        return useFormDuplicates(form)
      },
      { wrapper },
    )
    act(() => void vi.advanceTimersByTime(400))
    const cle = JSON.stringify(client.getQueryCache().getAll()[0]?.queryKey)
    expect(cle).toContain('"last_name":"KOUASSI"')
    expect(cle).toContain('"first_name":"Aya"')
    expect(cle).toContain('"birth_date":"2010-03-14"')
    expect(cle).toContain('"enrollment_number":"ECER0882"')
  })
})
