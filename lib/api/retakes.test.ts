import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Le client HTTP lit la session NextAuth pour poser l'entête d'autorisation.
// Ici on teste l'adresse appelée et le contrat de réponse, pas l'auth.
vi.mock("next-auth/react", () => ({
  getSession: vi.fn().mockResolvedValue(null),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

import { retakesApi } from "./retakes"

const TARGET = {
  evaluation_id: 7,
  title: "Devoir de mathématiques",
  subject_name: "Mathématiques",
  date: "2026-05-18",
  coefficient: 2,
  trimester: 1,
}

const AUTHORIZATION = {
  id: 4,
  student_id: 42,
  student_name: "Traoré Aminata",
  enrollment_number: "M-2026-004",
  class_name: "6ème B",
  academic_year_id: 3,
  academic_year_name: "2025-2026",
  trimester: 1,
  period_start: "2026-05-15",
  period_end: "2026-05-22",
  reason: "Hospitalisation justifiée",
  reference: "BAZ-2026-M-2026-004-4",
  issued_by_user_id: 7,
  issued_by_name: "Yao Sophie",
  evaluations: [TARGET],
  created_at: "2026-05-23T09:00:00",
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

function calledPath(fetchMock: ReturnType<typeof vi.fn>): string {
  return new URL(String(fetchMock.mock.calls[0][0]), "http://api.test").pathname + new URL(String(fetchMock.mock.calls[0][0]), "http://api.test").search
}

describe("retakesApi.missedEvaluations", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test"
    vi.spyOn(console, "error").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("asks the school-life endpoint, not the class grade book", async () => {
    const fetchMock = respondWith([TARGET])

    await expect(retakesApi.missedEvaluations(42, "2026-05-15", "2026-05-22")).resolves.toEqual([
      TARGET,
    ])

    // Un seul appel, sur le point d'entrée gardé par le droit du billet.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(calledPath(fetchMock)).toBe(
      "/school-life/students/42/missed-evaluations?from=2026-05-15&to=2026-05-22",
    )
  })

  it("accepts a target whose subject is not filled in", async () => {
    respondWith([{ ...TARGET, subject_name: null }])
    const targets = await retakesApi.missedEvaluations(42, "2026-05-15", "2026-05-22")
    expect(targets[0].subject_name).toBeNull()
  })

  it("refuses a payload that does not match the contract", async () => {
    respondWith([{ ...TARGET, coefficient: "deux" }])
    await expect(
      retakesApi.missedEvaluations(42, "2026-05-15", "2026-05-22"),
    ).rejects.toThrow(/Réponse inattendue/)
  })
})

describe("retakesApi.list", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test"
    vi.spyOn(console, "error").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("reads the page envelope and the register-wide counts", async () => {
    respondWith({
      items: [AUTHORIZATION],
      total: 412,
      reopened_evaluations: 907,
      page: 2,
      size: 20,
    })

    const page = await retakesApi.list({ academic_year_id: 3, page: 2, size: 20 })

    expect(page.items).toHaveLength(1)
    // Les deux chiffres décrivent l'année consultée, pas les vingt lignes rendues.
    expect(page.total).toBe(412)
    expect(page.reopened_evaluations).toBe(907)
  })

  it("carries the year and the page in the query string", async () => {
    const fetchMock = respondWith({
      items: [],
      total: 0,
      reopened_evaluations: 0,
      page: 1,
      size: 20,
    })

    await retakesApi.list({ academic_year_id: 3, trimester: 2, page: 1, size: 20 })

    expect(calledPath(fetchMock)).toBe(
      "/school-life/retake-authorizations?academic_year_id=3&trimester=2&page=1&size=20",
    )
  })

  it("refuses a bare array, the shape served before pagination", async () => {
    respondWith([AUTHORIZATION])
    await expect(retakesApi.list()).rejects.toThrow(/Réponse inattendue/)
  })
})
