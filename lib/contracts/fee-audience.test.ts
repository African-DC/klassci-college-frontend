import { describe, expect, it } from "vitest"

import {
  audienceLabel,
  feeSumLabel,
  feeVariantFullName,
  mostSpecificVariantPerCategory,
  variantAppliesTo,
  type FeeAudience,
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

describe("variantAppliesTo", () => {
  it("facture un tarif sans restriction à tout le monde", () => {
    expect(variantAppliesTo(tarif({}), NOUVEAU_NON_AFFECTE)).toBe(true)
    expect(variantAppliesTo(tarif({}), NON_TRANCHE)).toBe(true)
  })

  it("ne facture pas à un ancien un tarif réservé aux nouveaux", () => {
    const reserve = tarif({ enrollment_profile: "nouveau" })

    expect(
      variantAppliesTo(reserve, { assignment_scope: "non_affecte", enrollment_profile: "ancien" }),
    ).toBe(false)
  })

  it("ne facture aucun tarif ciblé quand le profil n'est pas tranché", () => {
    // Le vide de l'historique ne dit pas qu'un élève est nouveau. Facturer sur
    // cette supposition, c'est facturer au hasard.
    expect(variantAppliesTo(tarif({ enrollment_profile: "nouveau" }), NON_TRANCHE)).toBe(false)
    expect(variantAppliesTo(tarif({ enrollment_profile: "ancien" }), NON_TRANCHE)).toBe(false)
  })

  it("continue de filtrer sur l'affectation", () => {
    expect(variantAppliesTo(tarif({ assignment_scope: "affecte" }), NOUVEAU_NON_AFFECTE)).toBe(false)
  })
})

describe("mostSpecificVariantPerCategory", () => {
  it("ne retient qu'un tarif par catégorie : une ligne de frais, pas deux", () => {
    const retenus = mostSpecificVariantPerCategory(
      [tarif({}), tarif({ assignment_scope: "non_affecte", amount: 8000 })],
      NOUVEAU_NON_AFFECTE,
    )

    expect(retenus).toHaveLength(1)
    expect(retenus[0]?.amount).toBe(8000)
  })

  it("préfère le tarif ciblé au tarif universel de la même catégorie", () => {
    const retenus = mostSpecificVariantPerCategory(
      [tarif({ amount: 10000 }), tarif({ enrollment_profile: "nouveau", amount: 12000 })],
      NOUVEAU_NON_AFFECTE,
    )

    expect(retenus[0]?.amount).toBe(12000)
  })

  it("écarte le tarif d'un autre public au lieu de l'ajouter à l'assiette", () => {
    // Le défaut d'origine : un tarif « nouveaux » entrait dans le total de
    // tout le monde, et la simulation annonçait des francs que personne ne
    // paierait.
    const retenus = mostSpecificVariantPerCategory(
      [
        tarif({ fee_category_id: SCOLARITE, amount: 30000 }),
        tarif({ fee_category_id: TENUE, enrollment_profile: "nouveau", amount: 7000 }),
      ],
      { assignment_scope: "non_affecte", enrollment_profile: "ancien" },
    )

    expect(retenus.reduce((t, v) => t + v.amount, 0)).toBe(30000)
  })

  it("retient le tarif du tronc commun quand l'appelant ne désigne pas de série", () => {
    const retenus = mostSpecificVariantPerCategory(
      [tarif({ series_id: 4, amount: 20000 }), tarif({ amount: 15000 })],
      NOUVEAU_NON_AFFECTE,
    )

    expect(retenus[0]?.amount).toBe(15000)
  })
})

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
