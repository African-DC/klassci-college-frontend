import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Le client HTTP lit la session NextAuth pour poser l'entête d'autorisation.
// Ici on teste l'adresse appelée et le contrat de réponse, pas l'auth.
vi.mock("next-auth/react", () => ({
  getSession: vi.fn().mockResolvedValue(null),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

import { feesApi } from "./fees"
import { formatDebtDelta } from "@/lib/contracts/fee"

/**
 * Le serveur sérialise ses décimales en chaînes, le reste de l'écran les
 * additionne comme des nombres. Un `z.number()` nu ferait échouer la
 * validation sur un montant parfaitement valide, et la comptable lirait
 * « réponse inattendue du serveur » devant un tarif qu'elle vient de saisir.
 */
const APERCU = {
  variant_id: 12,
  fee_category_id: 3,
  category_name: "Scolarité T1",
  academic_year_id: 2,
  amount: "45000.00",
  enrollments_concerned: 12,
  fees_to_update: 9,
  fees_already_up_to_date: 1,
  fees_kept_with_payments: 2,
  fees_waived: 0,
  debt_delta: "-81000.00",
  message: "9 lignes à mettre à jour, 2 lignes conservées car des versements y sont imputés.",
}

const RESULTAT = { ...APERCU, fees_updated: 9 }

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

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://api.test"
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("feesApi.propagationPreview", () => {
  it("interroge l'aperçu du tarif visé, sans rien écrire", async () => {
    const fetchMock = respondWith(APERCU)

    await feesApi.propagationPreview(12)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined]
    expect(url).toContain("/admin/fee-variants/12/propagation-preview")
    expect(init?.method ?? "GET").toBe("GET")
  })

  it("convertit les décimales du serveur en nombres exploitables", async () => {
    respondWith(APERCU)

    const apercu = await feesApi.propagationPreview(12)

    expect(apercu.amount).toBe(45000)
    expect(apercu.debt_delta).toBe(-81000)
    expect(apercu.fees_to_update).toBe(9)
    expect(apercu.fees_kept_with_payments).toBe(2)
  })

  it("rejette une réponse à laquelle il manque un compteur", async () => {
    const tronquee: Record<string, unknown> = { ...APERCU }
    delete tronquee.fees_kept_with_payments
    respondWith(tronquee)

    await expect(feesApi.propagationPreview(12)).rejects.toThrow(/Réponse inattendue/)
  })
})

describe("feesApi.propagate", () => {
  it("confirme en POST sur le tarif visé", async () => {
    const fetchMock = respondWith(RESULTAT)

    const resultat = await feesApi.propagate(12)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined]
    expect(url).toContain("/admin/fee-variants/12/propagate")
    expect(init?.method).toBe("POST")
    expect(resultat.fees_updated).toBe(9)
  })

  it("annonce exactement les compteurs de l'aperçu quand rien n'a bougé entre les deux", async () => {
    respondWith(APERCU)
    const apercu = await feesApi.propagationPreview(12)
    respondWith(RESULTAT)
    const resultat = await feesApi.propagate(12)

    expect(resultat.fees_updated).toBe(apercu.fees_to_update)
    expect(resultat.fees_kept_with_payments).toBe(apercu.fees_kept_with_payments)
    expect(resultat.enrollments_concerned).toBe(apercu.enrollments_concerned)
    expect(resultat.debt_delta).toBe(apercu.debt_delta)
  })
})

describe("formatDebtDelta", () => {
  it("dit le sens de l'écart, pas seulement son montant", () => {
    expect(formatDebtDelta(45000)).toMatch(/^\+45/)
    expect(formatDebtDelta(-81000)).toMatch(/^−81/)
  })

  it("n'affiche ni signe ni ambiguïté quand la dette ne bouge pas", () => {
    expect(formatDebtDelta(0)).toBe("0 F")
  })

  it("groupe les milliers pour qu'un montant se lise d'un coup d'œil", () => {
    // Séparateur de milliers en français : espace, fine ou insécable selon
    // l'environnement. On vérifie qu'il y en a un, pas lequel.
    expect(formatDebtDelta(1250000)).toMatch(/^\+1\s?250\s?000 F$/u)
  })
})
