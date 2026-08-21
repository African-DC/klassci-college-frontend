/**
 * La coquille d'administration accueillait le caissier Ibrahim Tanoh par
 * « Bonjour, Cashier3 », et l'étiquetait « Staff », pendant que l'écran juste
 * en dessous affichait son vrai nom. La session ne transportait pas les noms
 * que le backend renvoie pourtant à la connexion.
 */

import { describe, expect, it } from "vitest"

import { displayName, greetingName, roleLabel } from "./session-identity"

describe("displayName", () => {
  it("rend le nom complet quand la session le porte", () => {
    expect(
      displayName({ email: "cashier3@demo.klassci.ci", firstName: "Ibrahim", lastName: "Tanoh" }),
    ).toBe("Ibrahim Tanoh")
  })

  it("retombe sur le début de l'adresse pour une session ouverte avant le correctif", () => {
    // Ces sessions restent valables plusieurs jours : sans ce repli, l'écran
    // afficherait « undefined » jusqu'à la prochaine connexion.
    expect(displayName({ email: "cashier3@demo.klassci.ci" })).toBe("cashier3")
  })

  it("se contente du prénom quand le nom manque", () => {
    expect(displayName({ email: "a@b.ci", firstName: "Ibrahim" })).toBe("Ibrahim")
  })

  it("ne rend jamais une chaîne vide", () => {
    expect(displayName(undefined)).toBe("Utilisateur")
    expect(displayName({ email: "" })).toBe("Utilisateur")
  })
})

describe("greetingName", () => {
  it("rend le prénom seul, pas le nom complet", () => {
    expect(greetingName({ email: "a@b.ci", firstName: "Ibrahim", lastName: "Tanoh" })).toBe(
      "Ibrahim",
    )
  })

  it("retombe sur le début de l'adresse sans prénom", () => {
    expect(greetingName({ email: "cashier3@demo.klassci.ci" })).toBe("cashier3")
  })
})

describe("roleLabel", () => {
  it("traduit le rôle de portail en français", () => {
    expect(roleLabel("admin")).toBe("Administrateur")
    expect(roleLabel("teacher")).toBe("Enseignant")
    expect(roleLabel("parent")).toBe("Parent")
  })

  it("dit « Personnel » pour staff, sans inventer un métier", () => {
    // `/auth/me` rend le rôle de portail : `staff` couvre indifféremment le
    // caissier, l'éducateur, le comptable, le secrétariat et le directeur des
    // études. Afficher « Caissier » serait une précision que la session n'a pas.
    expect(roleLabel("staff")).toBe("Personnel")
  })

  it("ne rend rien plutôt qu'un mot faux quand le rôle manque", () => {
    expect(roleLabel(undefined)).toBe("")
  })
})
