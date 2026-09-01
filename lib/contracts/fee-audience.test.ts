import { describe, expect, it } from "vitest"

import {
  audienceLabel,
  basketTotal,
  feeSumLabel,
  feeVariantFullName,
  type FeeAudience,
  type MandatoryBasket,
} from "./fee-audience"

const SCOLARITE = 1
const TENUE = 2

const NOUVEAU_NON_AFFECTE: FeeAudience = {
  assignment_scope: "non_affecte",
  enrollment_profile: "nouveau",
}
const NON_TRANCHE: FeeAudience = {
  assignment_scope: "non_affecte",
  enrollment_profile: null,
}

interface TarifTest {
  fee_category_id: number
  series_id: number | null
  assignment_scope: string | null
  enrollment_profile: string | null
  amount: number
}

function tarif(over: Partial<TarifTest> = {}): TarifTest {
  return {
    fee_category_id: SCOLARITE,
    series_id: null,
    assignment_scope: null,
    enrollment_profile: null,
    amount: 10000,
    ...over,
  }
}


describe("audienceLabel", () => {
  it("nomme le public d'une simulation, profil compris", () => {
    expect(audienceLabel(NOUVEAU_NON_AFFECTE)).toBe("élève non affecté, première inscription")
    expect(audienceLabel(NON_TRANCHE)).toBe("élève non affecté, profil non tranché")
  })
})

describe("feeSumLabel", () => {
  it("ne dit « par élève » que d'une somme qu'un élève paie vraiment", () => {
    expect(feeSumLabel(false)).toContain("élève")
    expect(feeSumLabel(true)).not.toContain("élève")
  })
})

describe("feeVariantFullName", () => {
  it("distingue deux tarifs de la même catégorie sur le même niveau", () => {
    const affecte = feeVariantFullName(tarif({ assignment_scope: "affecte" }), {
      category: "Scolarité T1",
      level: "6eme",
    })
    const nouveaux = feeVariantFullName(tarif({ enrollment_profile: "nouveau" }), {
      category: "Scolarité T1",
      level: "6eme",
    })

    expect(affecte).not.toBe(nouveaux)
    expect(affecte).toContain("affecté")
    expect(nouveaux).toContain("nouveaux")
  })

  it("nomme la série quand elle distingue le tarif", () => {
    expect(
      feeVariantFullName(tarif({ series_id: 4 }), {
        category: "Scolarité T1",
        level: "2nde",
        series: "A",
      }),
    ).toContain("série A")
  })

  it("reste lisible quand rien ne restreint le tarif", () => {
    expect(feeVariantFullName(tarif({}), { category: "Scolarité T1", level: "6eme" })).toBe(
      "Scolarité T1 · 6eme",
    )
  })
})

describe("basketTotal", () => {
  const panier: MandatoryBasket = {
    items: [
      { level_id: 10, assignment_scope: "non_affecte", enrollment_profile: "nouveau", total: 33000 },
      { level_id: 10, assignment_scope: "non_affecte", enrollment_profile: null, total: 30000 },
    ],
  }

  it("lit le total du public demandé", () => {
    expect(basketTotal(panier, 10, NOUVEAU_NON_AFFECTE)).toBe(33000)
    expect(basketTotal(panier, 10, NON_TRANCHE)).toBe(30000)
  })

  it("ne devine rien quand le serveur n'a pas répondu ou que le niveau manque", () => {
    // L'écran affiche alors zéro sans l'affirmer : c'est le serveur qui sait,
    // et l'ancienne version recalculait justement ici, en divergeant.
    expect(basketTotal(undefined, 10, NOUVEAU_NON_AFFECTE)).toBeUndefined()
    expect(basketTotal(panier, undefined, NOUVEAU_NON_AFFECTE)).toBeUndefined()
    expect(basketTotal(panier, 99, NOUVEAU_NON_AFFECTE)).toBeUndefined()
  })
})
