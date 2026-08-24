import { beforeEach, describe, expect, it, vi } from "vitest"

// Le client HTTP lit la session NextAuth pour poser l'entête d'autorisation.
// Ici on teste l'adresse appelée et le contrat de réponse, pas l'auth.
vi.mock("next-auth/react", () => ({
  getSession: vi.fn().mockResolvedValue(null),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

import { parentPortalApi } from "./parent-portal"
import { studentPortalApi } from "./student-portal"

/** Réponse BE réelle de `GET /student/bulletins` (enveloppe items/total). */
const STUDENT_BULLETINS = {
  items: [
    {
      id: 5,
      trimester: 1,
      average: "14.30",
      rank: 4,
      mention: "B",
      class_name: "6ème A",
      academic_year_name: "2025-2026",
      file_url: null,
      generated_at: "2026-08-09T16:32:59",
    },
  ],
  total: 1,
}

function respondWithJson(payload: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  )
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function respondWithPdf() {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response("%PDF-1.7", {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    }),
  )
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function calledPath(fetchMock: ReturnType<typeof vi.fn>): string {
  return new URL(String(fetchMock.mock.calls[0][0]), "http://api.test").pathname
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://api.test"
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

describe("téléchargement d'un bulletin depuis un portail", () => {
  it("l'élève passe par le portail élève, jamais par la route d'administration", async () => {
    const fetchMock = respondWithPdf()

    const blob = await studentPortalApi.downloadBulletin(5)

    expect(calledPath(fetchMock)).toBe("/student/bulletins/5/pdf")
    expect(calledPath(fetchMock)).not.toContain("/reports/")
    expect(blob.type).toBe("application/pdf")
  })

  it("le parent porte l'identifiant de son enfant dans l'adresse", async () => {
    const fetchMock = respondWithPdf()

    const blob = await parentPortalApi.downloadChildBulletinPdf(42, 5)

    expect(calledPath(fetchMock)).toBe("/parent/children/42/bulletins/5/pdf")
    expect(calledPath(fetchMock)).not.toContain("/reports/")
    expect(blob.type).toBe("application/pdf")
  })

  it("remonte le message du serveur quand le bulletin est refusé", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Bulletin with id 9 not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    )

    await expect(studentPortalApi.downloadBulletin(9)).rejects.toThrow(
      "Bulletin with id 9 not found",
    )
  })
})

describe("studentPortalApi.getBulletins", () => {
  it("normalise l'enveloppe du serveur vers le contrat de l'écran", async () => {
    respondWithJson(STUDENT_BULLETINS)

    const bulletins = await studentPortalApi.getBulletins()

    expect(bulletins).toHaveLength(1)
    expect(bulletins[0]).toMatchObject({
      id: 5,
      trimester: "Trimestre 1",
      academic_year: "2025-2026",
      general_average: 14.3,
      rank: 4,
      total_students: null,
      status: "publie",
    })
  })

  it("rend une liste vide quand l'élève n'a aucun bulletin publié", async () => {
    respondWithJson({ items: [], total: 0 })

    await expect(studentPortalApi.getBulletins()).resolves.toEqual([])
  })
})
