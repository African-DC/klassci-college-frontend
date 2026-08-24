/**
 * Quand s'arrêter de charger.
 *
 * La page des paiements affichait « Page 1/92 » sans aucun moyen d'atteindre
 * la seconde : la pagination était affichée, pas navigable. Le défilement
 * continu la remplace, et la seule décision qu'il porte est celle-ci.
 */

import { describe, expect, it } from "vitest"
import { pageSuivante } from "./pagination"

const pleine = (n: number) => ({ items: Array.from({ length: n }), size: n })

describe("le chargement au fil du défilement", () => {
  it("demande la suite tant que les pages arrivent pleines", () => {
    expect(pageSuivante(pleine(20), 1)).toBe(2)
    expect(pageSuivante(pleine(20), 5)).toBe(6)
  })

  it("s'arrête sur une page incomplète", () => {
    expect(pageSuivante({ items: Array.from({ length: 7 }), size: 20 }, 3)).toBeUndefined()
  })

  it("s'arrête sur une page vide", () => {
    expect(pageSuivante({ items: [], size: 20 }, 4)).toBeUndefined()
  })

  it("ne se fie pas au total annoncé", () => {
    // Une page pleine suffit à continuer, même si le total dit le contraire :
    // entre deux requêtes, une caissière encaisse et un collègue annule.
    expect(pageSuivante(pleine(20), 92)).toBe(93)
  })

  it("tolère une taille de page absente", () => {
    expect(pageSuivante({ items: Array.from({ length: 20 }), size: 0 }, 1)).toBe(2)
  })
})
