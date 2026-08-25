import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Le client HTTP lit la session NextAuth pour poser l'entête d'autorisation.
// Ici on teste l'adresse appelée et le contrat de réponse, pas l'auth.
vi.mock("next-auth/react", () => ({
  getSession: vi.fn().mockResolvedValue(null),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

import { gradesApi } from "./grades"
import { bulletinsApi } from "./bulletins"

const EVALUATION = {
  id: 1,
  title: "Devoir de mathématiques",
  type: "devoir",
  date: "2026-05-18",
  coefficient: 2,
  subject_id: 20,
  subject_name: "Mathématiques",
  class_id: 10,
  class_name: "6ème A",
  teacher_id: 30,
  teacher_name: "Aïssatou Diallo",
  academic_year_id: 3,
  trimester: 1,
  total_students: 35,
  graded_students: 12,
  created_at: "2026-05-18T09:00:00",
}

const BULLETIN = {
  id: 1,
  student_id: 42,
  student_name: "Traoré Aminata",
  student_photo_url: null,
  student_enrollment_number: "M-2026-004",
  class_id: 10,
  class_name: "6ème A",
  academic_year_id: 3,
  trimester: 1,
  average: "12.50",
  rank: 7,
  total_students: 34,
  mention: "AB",
  file_url: null,
  generated_at: null,
  is_published: true,
  teacher_comment: null,
  council_decision: null,
  subject_averages: [
    { subject_id: 20, subject_name: "Mathématiques", average: "12.50", coefficient: 4 },
  ],
  created_at: "2026-05-18T09:00:00",
  updated_at: "2026-05-18T09:00:00",
}

function respondWith(payload: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  )
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function calledUrl(fetchMock: ReturnType<typeof vi.fn>): URL {
  return new URL(String(fetchMock.mock.calls[0][0]), "http://api.test")
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://api.test"
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("gradesApi.listEvaluations", () => {
  it("demande une page bornée au lieu de toute l'année", async () => {
    const fetchMock = respondWith({ items: [EVALUATION], total: 772, page: 1, size: 100 })

    await gradesApi.listEvaluations(10)

    const url = calledUrl(fetchMock)
    expect(url.pathname).toBe("/evaluations")
    expect(url.searchParams.get("class_id")).toBe("10")
    expect(url.searchParams.get("page")).toBe("1")
    expect(Number(url.searchParams.get("size"))).toBeLessThanOrEqual(100)
  })

  it("rend le total de l'école et non celui de la page", async () => {
    respondWith({ items: [EVALUATION], total: 772, page: 1, size: 100 })

    const page = await gradesApi.listEvaluations(10)

    // Le piège : compter `items` donnerait 1 et l'écran afficherait
    // « 1 évaluation » pour une école qui en compte 772.
    expect(page.total).toBe(772)
    expect(page.items).toHaveLength(1)
  })

  it("conserve les deux compteurs de l'évaluation", async () => {
    respondWith({ items: [EVALUATION], total: 1, page: 1, size: 100 })

    const page = await gradesApi.listEvaluations(10)

    expect(page.items[0].total_students).toBe(35)
    expect(page.items[0].graded_students).toBe(12)
  })

  it("refuse une réponse sans enveloppe plutôt que de deviner", async () => {
    respondWith([EVALUATION])

    await expect(gradesApi.listEvaluations(10)).rejects.toThrow()
  })
})

describe("gradesApi.getEvaluation", () => {
  it("lit une évaluation seule, sans charger la liste de la classe", async () => {
    const fetchMock = respondWith(EVALUATION)

    const evaluation = await gradesApi.getEvaluation(1)

    expect(calledUrl(fetchMock).pathname).toBe("/evaluations/1")
    expect(evaluation.title).toBe("Devoir de mathématiques")
    expect(evaluation.graded_students).toBe(12)
  })
})

describe("bulletinsApi.list", () => {
  it("demande une page bornée", async () => {
    const fetchMock = respondWith({ items: [BULLETIN], total: 2148, page: 1, size: 50 })

    await bulletinsApi.list({ class_id: 10, trimester: 1 })

    const url = calledUrl(fetchMock)
    expect(url.pathname).toBe("/reports/bulletins")
    expect(url.searchParams.get("class_id")).toBe("10")
    expect(Number(url.searchParams.get("size"))).toBeLessThanOrEqual(100)
  })

  it("rend la pagination du serveur et non une pagination inventée", async () => {
    respondWith({ items: [BULLETIN], total: 2148, page: 3, size: 50 })

    const result = await bulletinsApi.list({ page: 3 })

    // Avant, le client posait `page: 1` et `size: items.length`, ce qui
    // faisait toujours « Page 1/1 » quel que soit le nombre de bulletins.
    expect(result.total).toBe(2148)
    expect(result.page).toBe(3)
    expect(result.size).toBe(50)
    expect(Math.ceil(result.total / result.size)).toBe(43)
  })

  it("laisse l'appelant choisir sa taille de page", async () => {
    const fetchMock = respondWith({ items: [], total: 0, page: 1, size: 1 })

    await bulletinsApi.list({ class_id: 10, trimester: 1, is_published: false, size: 1 })

    expect(calledUrl(fetchMock).searchParams.get("size")).toBe("1")
  })
})
