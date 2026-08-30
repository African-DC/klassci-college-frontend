import { beforeEach, describe, expect, it, vi } from "vitest"

// Le client HTTP lit la session NextAuth pour poser l'entête d'autorisation.
// Ici on teste l'adresse appelée et le contrat de réponse, pas l'auth.
vi.mock("next-auth/react", () => ({
  getSession: vi.fn().mockResolvedValue(null),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

import { cashSessionsApi } from "./cash-sessions"

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

function calledUrl(fetchMock: ReturnType<typeof vi.fn>): URL {
  return new URL(String(fetchMock.mock.calls[0][0]), "http://api.test")
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://api.test"
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

describe("bordereau journalier", () => {
  it("demande la journée affichée à l'écran, pas la date du serveur", async () => {
    const fetchMock = respondWithPdf()

    const blob = await cashSessionsApi.dailyCashBook("2026-08-20")

    const url = calledUrl(fetchMock)
    expect(url.pathname).toBe("/payments/daily-cash-book")
    expect(url.searchParams.get("date")).toBe("2026-08-20")
    expect(blob.type).toBe("application/pdf")
  })

  it("ne porte aucun paramètre de portée : le serveur la déduit des droits", async () => {
    const fetchMock = respondWithPdf()

    await cashSessionsApi.dailyCashBook("2026-08-21")

    const params = [...calledUrl(fetchMock).searchParams.keys()]
    expect(params).toEqual(["date"])
  })

  it("Ma caisse appelle l'endpoint borné à l'appelant, pas le consolidé", async () => {
    const fetchMock = respondWithPdf()

    const blob = await cashSessionsApi.myDailyCashBook("2026-08-30")

    const url = calledUrl(fetchMock)
    expect(url.pathname).toBe("/cash-sessions/me/daily-cash-book")
    expect(url.searchParams.get("date")).toBe("2026-08-30")
    expect([...url.searchParams.keys()]).toEqual(["date"])
    expect(blob.type).toBe("application/pdf")
  })
})
