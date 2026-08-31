import { describe, expect, it } from "vitest"

import {
  ENROLLMENT_PROFILES,
  FeeVariantSchema,
  FeeVariantUpdateSchema,
  enrollmentProfileBadge,
  enrollmentProfileLabel,
} from "./fee"

const TARIF = {
  id: 7,
  fee_category_id: 3,
  level_id: 1,
  series_id: null,
  academic_year_id: 2,
  amount: "12000.00",
  description: null,
}

describe("FeeVariantSchema — profil d'inscription", () => {
  it("accepte les deux profils que le serveur connaît", () => {
    expect(FeeVariantSchema.parse({ ...TARIF, enrollment_profile: "nouveau" }).enrollment_profile)
      .toBe("nouveau")
    expect(FeeVariantSchema.parse({ ...TARIF, enrollment_profile: "ancien" }).enrollment_profile)
      .toBe("ancien")
  })

  it("refuse un profil inventé plutôt que de le laisser passer", () => {
    // Un profil inconnu qui traverse la validation, c'est un tarif affiché
    // « pour tous » alors qu'il ne l'est pas.
    expect(() => FeeVariantSchema.parse({ ...TARIF, enrollment_profile: "redoublant" })).toThrow()
  })

  it("tolère un tarif sans profil, comme les grilles déjà en base", () => {
    const tarif = FeeVariantSchema.parse(TARIF)

    expect(tarif.enrollment_profile ?? null).toBeNull()
  })
})

describe("FeeVariantUpdateSchema — revenir à « tous les élèves »", () => {
  /**
   * Le serveur distingue le champ absent du champ envoyé vide : absent, il
   * garde le profil enregistré ; vide, il rend le tarif universel. L'écran ne
   * peut donc défaire une restriction que si `null` survit à la validation.
   */
  it("conserve le profil remis à zéro au lieu de l'effacer du corps envoyé", () => {
    const corps = FeeVariantUpdateSchema.parse({ amount: 12000, enrollment_profile: null })

    expect("enrollment_profile" in corps).toBe(true)
    expect(corps.enrollment_profile).toBeNull()
  })

  it("laisse le champ absent absent, pour ne pas trancher à la place de l'école", () => {
    const corps = FeeVariantUpdateSchema.parse({ amount: 12000 })

    expect("enrollment_profile" in corps).toBe(false)
  })
})

describe("Libellés du profil", () => {
  it("dit « tous les élèves » quand rien ne restreint le tarif", () => {
    expect(enrollmentProfileLabel(null)).toBe("Tous les élèves")
    expect(enrollmentProfileLabel(undefined)).toBe("Tous les élèves")
  })

  it("ne pose aucun repère dans la grille pour un tarif universel", () => {
    // Sinon chaque ligne porterait une étiquette, et l'étiquette cesserait de
    // signaler quoi que ce soit.
    expect(enrollmentProfileBadge(null)).toBeNull()
    expect(enrollmentProfileBadge("nouveau")).toBe("nouveaux")
    expect(enrollmentProfileBadge("ancien")).toBe("anciens")
  })

  it("annonce que l'autre profil ne paie pas, pas qu'il paie autrement", () => {
    for (const profil of ENROLLMENT_PROFILES.filter((p) => p.value !== null)) {
      expect(profil.hint).toMatch(/ne le paient pas du tout/)
    }
  })
})
