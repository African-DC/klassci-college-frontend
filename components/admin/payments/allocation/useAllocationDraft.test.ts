import { describe, expect, it } from "vitest"
import { capForFee, parseAmount } from "./useAllocationDraft"

/**
 * Ce qui reste à tester côté écran, une fois le calcul rendu au serveur.
 *
 * Ni la cascade, ni le reste dû, ni le sort d'un frais réglé en nature ne sont
 * vérifiés ici : ils appartiennent au backend, et les vérifier une seconde fois
 * en TypeScript reviendrait à en faire une seconde définition. Restent la
 * lecture d'un champ de saisie et le plafond d'un bouton.
 */

describe("parseAmount", () => {
  it("lit un nombre simple", () => {
    expect(parseAmount("50000")).toBe(50000)
  })

  it("accepte les séparateurs de milliers tapés au guichet", () => {
    expect(parseAmount("50 000")).toBe(50000)
    expect(parseAmount("50 000")).toBe(50000)
    expect(parseAmount("50 000")).toBe(50000)
  })

  it("accepte la virgule décimale", () => {
    expect(parseAmount("1500,50")).toBe(1500.5)
  })

  it("rend zéro plutôt que NaN sur une saisie illisible", () => {
    // Sans cela, le totalisateur afficherait « NaN à répartir » pendant la frappe.
    expect(parseAmount("abc")).toBe(0)
    expect(parseAmount("")).toBe(0)
    expect(parseAmount(undefined)).toBe(0)
    expect(parseAmount(null)).toBe(0)
  })

  it("refuse un montant négatif", () => {
    expect(parseAmount("-5000")).toBe(0)
  })
})

describe("capForFee", () => {
  it("s'arrête au reste dû du frais quand le versement est large", () => {
    // Le frais ne doit plus que 30 000, le versement en offre 100 000.
    expect(capForFee(30000, 100000, 0, 0)).toBe(30000)
  })

  it("s'arrête à ce qui reste du versement quand le frais est plus gros", () => {
    // 80 000 dus sur ce frais, mais 20 000 sont déjà posés ailleurs.
    expect(capForFee(80000, 50000, 20000, 0)).toBe(30000)
  })

  it("ne compte pas deux fois ce qui est déjà posé sur ce frais", () => {
    // 10 000 sont déjà sur cette ligne : re-cliquer « Le maximum » doit
    // proposer 50 000, pas 40 000.
    expect(capForFee(80000, 50000, 10000, 10000)).toBe(50000)
  })

  it("ne descend jamais sous zéro", () => {
    expect(capForFee(30000, 10000, 25000, 0)).toBe(0)
  })
})
