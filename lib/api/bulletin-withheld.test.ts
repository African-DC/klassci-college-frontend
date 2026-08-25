import { beforeEach, describe, expect, it, vi } from "vitest"

// Le client HTTP lit la session NextAuth pour poser l'entête d'autorisation.
// Ici on teste la lecture du contrat, pas l'auth.
vi.mock("next-auth/react", () => ({
  getSession: vi.fn().mockResolvedValue(null),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

import { parentPortalApi } from "./parent-portal"
import { studentPortalApi } from "./student-portal"

const REASON =
  "Bulletin du 1er trimestre indisponible : 45 000 FCFA en retard sur l'échéancier. " +
  "Rapprochez-vous du secrétariat."

/** `GET /student/bulletins` pour une famille à jour de son échéancier. */
const STUDENT_RELEASED = {
  items: [
    {
      id: 5,
      trimester: 1,
      average: "14.30",
      rank: 4,
      mention: "B",
      class_name: "6ème A",
      academic_year_name: "2025-2026",
      file_url: "/media/bulletins/5.pdf",
      generated_at: "2026-08-09T16:32:59",
      is_withheld: false,
      withheld_reason: null,
      withheld_amount: null,
    },
  ],
  total: 1,
}

/** La même liste, famille en retard : le bulletin est annoncé, pas divulgué. */
const STUDENT_WITHHELD = {
  items: [
    {
      id: 5,
      trimester: 1,
      average: null,
      rank: null,
      mention: null,
      class_name: "6ème A",
      academic_year_name: "2025-2026",
      file_url: null,
      generated_at: "2026-08-09T16:32:59",
      is_withheld: true,
      withheld_reason: REASON,
      withheld_amount: 45000,
    },
  ],
  total: 1,
}

const PARENT_WITHHELD = {
  student_id: 2,
  bulletins: [
    {
      id: 5,
      trimester: 1,
      average: null,
      rank: null,
      mention: null,
      class_name: "6ème A",
      academic_year_name: "2025-2026",
      is_published: true,
      generated_at: "2026-08-09T16:32:59",
      is_withheld: true,
      withheld_reason: REASON,
      withheld_amount: 45000,
    },
  ],
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

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://api.test"
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

describe("le portail élève lit la retenue pour impayé", () => {
  it("une famille à jour voit le contenu du bulletin", async () => {
    respondWithJson(STUDENT_RELEASED)

    const [bulletin] = await studentPortalApi.getBulletins()

    expect(bulletin.is_withheld).toBe(false)
    expect(bulletin.general_average).toBe(14.3)
    expect(bulletin.rank).toBe(4)
    expect(bulletin.withheld_reason).toBeNull()
  })

  it("une famille en retard voit le bulletin annoncé, vidé de son contenu", async () => {
    respondWithJson(STUDENT_WITHHELD)

    const bulletins = await studentPortalApi.getBulletins()

    expect(bulletins).toHaveLength(1)
    const [bulletin] = bulletins
    // Ce qui identifie le bulletin reste lisible : la liste ne se vide pas.
    expect(bulletin.trimester).toBe("Trimestre 1")
    expect(bulletin.academic_year).toBe("2025-2026")
    // Ce qu'il dit de l'élève est absent, et vaut null, jamais zéro.
    expect(bulletin.general_average).toBeNull()
    expect(bulletin.rank).toBeNull()
  })

  it("la retenue porte le motif et le montant dû", async () => {
    respondWithJson(STUDENT_WITHHELD)

    const [bulletin] = await studentPortalApi.getBulletins()

    expect(bulletin.is_withheld).toBe(true)
    expect(bulletin.withheld_amount).toBe(45000)
    expect(bulletin.withheld_reason).toBe(REASON)
  })

  it("un serveur qui ne pose pas encore les champs ne casse pas la liste", async () => {
    // Le front peut être déployé avant le serveur : l'absence des trois
    // champs se lit « rien n'est retenu », pas « la page est en erreur ».
    respondWithJson({
      items: [
        {
          id: 5,
          trimester: 1,
          average: "12.00",
          rank: 2,
          mention: "AB",
          class_name: "6ème A",
          academic_year_name: "2025-2026",
          file_url: null,
          generated_at: null,
        },
      ],
      total: 1,
    })

    const [bulletin] = await studentPortalApi.getBulletins()

    expect(bulletin.is_withheld).toBe(false)
    expect(bulletin.withheld_reason).toBeNull()
    expect(bulletin.general_average).toBe(12)
  })
})

describe("le portail parent lit la même retenue", () => {
  it("le parent d'une famille en retard voit le bulletin annoncé, vidé", async () => {
    respondWithJson(PARENT_WITHHELD)

    const response = await parentPortalApi.getChildBulletins(2)

    expect(response.bulletins).toHaveLength(1)
    const [bulletin] = response.bulletins
    expect(bulletin.trimester).toBe(1)
    expect(bulletin.class_name).toBe("6ème A")
    expect(bulletin.average).toBeNull()
    expect(bulletin.rank).toBeNull()
    expect(bulletin.mention).toBeNull()
    expect(bulletin.is_withheld).toBe(true)
    expect(bulletin.withheld_amount).toBe(45000)
    expect(bulletin.withheld_reason).toBe(REASON)
  })
})
