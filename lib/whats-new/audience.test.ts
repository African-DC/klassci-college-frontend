import { describe, expect, it } from "vitest"
import { concerne } from "./audience"

describe("qui lit quelle nouveauté", () => {
  it("montre une ligne sans persona à tout le monde", () => {
    // Le changelog dit « transverse » en n'en nommant aucun. Le lire comme
    // « on ne sait pas » ferait disparaître la ligne pour tous.
    expect(concerne("parent", [])).toBe(true)
    expect(concerne("teacher", [])).toBe(true)
    expect(concerne(undefined, [])).toBe(true)
  })

  it("donne les métiers de l'établissement au portail administration", () => {
    expect(concerne("admin", ["comptable"])).toBe(true)
    expect(concerne("admin", ["caissier"])).toBe(true)
    expect(concerne("admin", ["secrétariat"])).toBe(true)
  })

  it("ne montre pas à une famille ce qui parle de la caisse", () => {
    expect(concerne("parent", ["comptable", "caissier"])).toBe(false)
  })

  it("ne montre pas à une famille une note technique", () => {
    // Une sauvegarde nocturne ne veut rien dire pour un parent, et l'inquiéter
    // avec un vocabulaire d'exploitation serait pire que de se taire.
    expect(concerne("parent", ["devops"])).toBe(false)
    expect(concerne("student", ["technique"])).toBe(false)
  })

  it("donne au parent ce qui le nomme, même dans une liste", () => {
    expect(concerne("parent", ["élève", "parent"])).toBe(true)
  })

  it("donne à l'enseignant ce qui le nomme", () => {
    expect(concerne("teacher", ["enseignant"])).toBe(true)
    expect(concerne("teacher", ["admin"])).toBe(false)
  })

  it("ne montre rien de nommé à un portail inconnu", () => {
    // Un rôle qu'on ne sait pas traduire ne doit pas hériter de tout par
    // défaut : le défaut sûr est de ne montrer que le transverse.
    expect(concerne("gardien", ["admin"])).toBe(false)
    expect(concerne("gardien", [])).toBe(true)
  })

  it("ignore la casse du persona", () => {
    expect(concerne("admin", ["Comptable"])).toBe(true)
  })
})
