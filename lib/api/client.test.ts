import { describe, expect, it } from "vitest"
import { z } from "zod"
import { safeValidate } from "./client"

/**
 * Ce test existe pour une raison précise : `safeValidate` a longtemps inféré
 * son type de retour sur le côté **entrée** du schéma. Un champ portant
 * `.default()` y est facultatif, donc le type rendu n'était pas celui que le
 * schéma garantit, et l'appelant qui annonçait le bon type se faisait refuser
 * sa propre valeur — au point qu'on a cru devoir retirer les `.default()` que
 * la règle du dépôt recommande.
 */
describe("safeValidate", () => {
  const Schema = z.object({
    nom: z.string(),
    lignes: z.array(z.string()).default([]),
  })

  it("applique les valeurs par défaut", () => {
    const valide = safeValidate(Schema, { nom: "test" }, "test")
    expect(valide.lignes).toEqual([])
  })

  it("rend un type dont les défauts sont présents", () => {
    const valide = safeValidate(Schema, { nom: "test" }, "test")
    // Si le retour était inféré sur l'entrée, `lignes` serait optionnel ici et
    // cette ligne ne compilerait pas.
    const longueur: number = valide.lignes.length
    expect(longueur).toBe(0)
  })

  it("refuse une réponse qui ne correspond pas", () => {
    expect(() => safeValidate(Schema, { nom: 42 }, "test")).toThrow(/Réponse inattendue/)
  })
})
