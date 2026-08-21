import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Le client HTTP lit la session NextAuth pour poser l'entête d'autorisation.
// Ici on teste l'adresse appelée et le contrat de réponse, pas l'auth.
vi.mock("next-auth/react", () => ({
  getSession: vi.fn().mockResolvedValue(null),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

import { paymentsApi } from "./payments"

const VERSEMENT = {
  id: 1,
  enrollment_id: 4,
  amount: "50000.00",
  method: "cash",
  status: "completed",
  reference: "REC-0141",
  received_by: 12,
  received_by_name: "Sophie Yao",
  created_at: "2026-09-15T09:30:00",
  updated_at: "2026-09-15T09:30:00",
  student_name: "Traoré Aminata",
  allocations: [],
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

function respondWithBlob() {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response("%PDF-1.7", {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    }),
  )
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function url(fetchMock: ReturnType<typeof vi.fn>): URL {
  return new URL(String(fetchMock.mock.calls[0][0]), "http://api.test")
}

describe("le nom de l'encaisseur", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test"
    vi.spyOn(console, "error").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("arrive jusqu'à la liste affichée", async () => {
    respondWith({ items: [VERSEMENT], total: 1, page: 1, size: 20, total_pages: 1 })
    const page = await paymentsApi.list()
    expect(page.items[0].received_by_name).toBe("Sophie Yao")
  })

  it("reste facultatif sur un versement ancien, sans casser la lecture", async () => {
    const ancien: Record<string, unknown> = { ...VERSEMENT }
    delete ancien.received_by_name
    respondWith({ items: [ancien], total: 1, page: 1, size: 20, total_pages: 1 })
    const page = await paymentsApi.list()
    expect(page.items[0].received_by_name).toBeUndefined()
    expect(page.items[0].amount).toBe(50000)
  })

  it("alimente le filtre « Encaissé par »", async () => {
    const fetchMock = respondWith([
      { id: 12, name: "Sophie Yao" },
      { id: 18, name: "Mariam Diallo" },
    ])
    const caissiers = await paymentsApi.listCashiers()
    expect(url(fetchMock).pathname).toBe("/payments/cashiers")
    expect(caissiers.map((c) => c.name)).toEqual(["Sophie Yao", "Mariam Diallo"])
  })
})

describe("l'export du journal des versements", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test"
    vi.spyOn(console, "error").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("demande le PDF au serveur, pas au navigateur", async () => {
    const fetchMock = respondWithBlob()
    await paymentsApi.downloadJournal({}, "pdf")
    const called = url(fetchMock)
    expect(called.pathname).toBe("/payments/export")
    expect(called.searchParams.get("format")).toBe("pdf")
  })

  it("reprend les filtres de l'écran pour que les deux disent la même chose", async () => {
    const fetchMock = respondWithBlob()
    await paymentsApi.downloadJournal(
      {
        status: "completed",
        method: "cash",
        received_by: 12,
        date_from: "2026-09-01T00:00:00",
        date_to: "2026-09-30T23:59:59",
      },
      "xlsx",
    )
    const called = url(fetchMock)
    expect(called.searchParams.get("status")).toBe("completed")
    expect(called.searchParams.get("method")).toBe("cash")
    expect(called.searchParams.get("received_by")).toBe("12")
    expect(called.searchParams.get("date_from")).toBe("2026-09-01T00:00:00")
    expect(called.searchParams.get("date_to")).toBe("2026-09-30T23:59:59")
    expect(called.searchParams.get("format")).toBe("xlsx")
  })

  it("n'emporte pas la pagination : un journal se lit en entier", async () => {
    const fetchMock = respondWithBlob()
    await paymentsApi.downloadJournal({ page: 3, size: 20, status: "pending" })
    const called = url(fetchMock)
    expect(called.searchParams.get("page")).toBeNull()
    expect(called.searchParams.get("size")).toBeNull()
    expect(called.searchParams.get("status")).toBe("pending")
  })

  it("n'envoie pas de filtre vide, qui serait lu comme un critère", async () => {
    const fetchMock = respondWithBlob()
    await paymentsApi.downloadJournal({ status: undefined })
    expect(url(fetchMock).searchParams.get("status")).toBeNull()
  })
})
