import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Le client HTTP lit la session NextAuth pour poser l'entête d'autorisation.
// Ici on teste l'adresse appelée et le contrat de réponse, pas l'auth.
vi.mock("next-auth/react", () => ({
  getSession: vi.fn().mockResolvedValue(null),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

import { feesApi } from "./fees"
import {
  createMissingWarning,
  formatDebtDelta,
  propagationBuckets,
  propagationHeadline,
  propagationWriteCount,
} from "@/lib/contracts/fee-propagation"

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
  enrollments_concerned: 15,
  fees_to_update: 9,
  fees_to_create: 3,
  fees_already_up_to_date: 1,
  fees_kept_with_payments: 2,
  fees_waived: 0,
  debt_delta: "-81000.00",
  message: "9 lignes à mettre à jour, 2 lignes conservées car des versements y sont imputés.",
}

const RESULTAT = { ...APERCU, fees_updated: 9, fees_created: 3 }

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
    expect(apercu.fees_to_create).toBe(3)
    expect(apercu.fees_kept_with_payments).toBe(2)
  })

  it("rejette une réponse sans le compteur des lignes à créer", async () => {
    // Une dette qui apparaît chez une famille qui n'en avait pas ne peut pas
    // se deviner : mieux vaut refuser l'aperçu que l'afficher amputé.
    const tronquee: Record<string, unknown> = { ...APERCU }
    delete tronquee.fees_to_create
    respondWith(tronquee)

    await expect(feesApi.propagationPreview(12)).rejects.toThrow(/Réponse inattendue/)
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

  /**
   * `JSON.stringify` supprime les clés `undefined` : un drapeau laissé
   * implicite disparaîtrait du corps, et le serveur trancherait à la place de
   * l'école. Corriger une faute de frappe sur un prix ne doit ouvrir aucune
   * dette.
   */
  it("n'autorise aucune création tant qu'on ne la demande pas", async () => {
    const fetchMock = respondWith(RESULTAT)

    await feesApi.propagate(12)

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined]
    expect(JSON.parse(String(init?.body))).toEqual({ create_missing: false })
  })

  it("transmet la création quand l'école l'a explicitement cochée", async () => {
    const fetchMock = respondWith(RESULTAT)

    await feesApi.propagate(12, { createMissing: true })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined]
    expect(JSON.parse(String(init?.body))).toEqual({ create_missing: true })
  })

  it("annonce exactement les compteurs de l'aperçu quand rien n'a bougé entre les deux", async () => {
    respondWith(APERCU)
    const apercu = await feesApi.propagationPreview(12)
    respondWith(RESULTAT)
    const resultat = await feesApi.propagate(12)

    expect(resultat.fees_updated).toBe(apercu.fees_to_update)
    expect(resultat.fees_created).toBe(apercu.fees_to_create)
    expect(resultat.fees_kept_with_payments).toBe(apercu.fees_kept_with_payments)
    expect(resultat.enrollments_concerned).toBe(apercu.enrollments_concerned)
    expect(resultat.debt_delta).toBe(apercu.debt_delta)
  })
})

describe("propagationBuckets", () => {
  /**
   * La répartition est lue comme un compte : si les paquets ne reconstituent
   * pas le total affiché juste au-dessus, l'école cherche les inscriptions
   * manquantes au lieu de décider. C'est arrivé le jour où un paquet a été
   * ajouté au serveur sans l'être à l'écran.
   */
  it("reconstitue exactement le nombre d'inscriptions concernées", async () => {
    respondWith(APERCU)
    const apercu = await feesApi.propagationPreview(12)

    const somme = propagationBuckets(apercu).reduce((total, p) => total + p.count, 0)

    expect(somme).toBe(apercu.enrollments_concerned)
  })

  it("tombe juste aussi sur le résultat, avec les mêmes paquets", async () => {
    respondWith(RESULTAT)
    const resultat = await feesApi.propagate(12)

    const somme = propagationBuckets(resultat).reduce((total, p) => total + p.count, 0)

    expect(somme).toBe(resultat.enrollments_concerned)
  })

  it("dit les lignes à créer à part, et le dit même quand il n'y en a aucune", async () => {
    respondWith({ ...APERCU, enrollments_concerned: 12, fees_to_create: 0 })
    const apercu = await feesApi.propagationPreview(12)

    const creation = propagationBuckets(apercu).find((p) => p.key === "create")

    expect(creation?.count).toBe(0)
    // `emphase` = affiché même à zéro : « aucune dette n'apparaîtra » est une
    // réponse, l'absence de ligne n'en est pas une.
    expect(creation?.emphase).toBe(true)
  })
})

describe("propagationHeadline", () => {
  /**
   * Le défaut d'origine : la tête annonçait « 15 inscriptions portent ce
   * tarif » au-dessus d'un paquet qui disait « ces familles n'ont pas ce
   * frais ». Les deux phrases ne pouvaient pas être vraies ensemble.
   */
  it("ne prétend pas que toutes les inscriptions portent déjà le frais", async () => {
    respondWith(APERCU)
    const apercu = await feesApi.propagationPreview(12)

    const entete = propagationHeadline(apercu)

    expect(entete.total).toBe(15)
    expect(entete.phrase).not.toMatch(/portent/)
    expect(entete.detail).toContain("12")
    expect(entete.detail).toContain("3")
  })

  it("partage exactement le total entre les deux populations", async () => {
    respondWith(APERCU)
    const apercu = await feesApi.propagationPreview(12)

    const entete = propagationHeadline(apercu)
    const porteurs = entete.total - apercu.fees_to_create

    expect(entete.detail.startsWith(String(porteurs))).toBe(true)
  })

  it("dit au passé ce qui a été fait, une fois la répercussion passée", async () => {
    respondWith(RESULTAT)
    const resultat = await feesApi.propagate(12)

    expect(propagationHeadline(resultat).detail).toMatch(/portaient/)
  })

  it("le dit simplement quand aucune ligne ne manque", async () => {
    respondWith({ ...APERCU, enrollments_concerned: 12, fees_to_create: 0 })
    const apercu = await feesApi.propagationPreview(12)

    expect(propagationHeadline(apercu).detail).toBe("Toutes portent déjà ce frais.")
  })
})

describe("propagationWriteCount", () => {
  it("ne compte les lignes à créer que si la création est demandée", async () => {
    respondWith(APERCU)
    const apercu = await feesApi.propagationPreview(12)

    expect(propagationWriteCount(apercu)).toBe(9)
    expect(propagationWriteCount(apercu, true)).toBe(12)
  })

  it("laisse le bouton sans objet quand il n'y a rien à corriger et rien de coché", async () => {
    respondWith({ ...APERCU, fees_to_update: 0 })
    const apercu = await feesApi.propagationPreview(12)

    expect(propagationWriteCount(apercu)).toBe(0)
    expect(propagationWriteCount(apercu, true)).toBe(3)
  })
})

describe("createMissingWarning", () => {
  it("dit ce que la création fait, et à combien de familles", () => {
    expect(createMissingWarning(3)).toContain("3 familles")
    expect(createMissingWarning(3)).toMatch(/dette/)
    expect(createMissingWarning(1)).toContain("1 famille qui")
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
