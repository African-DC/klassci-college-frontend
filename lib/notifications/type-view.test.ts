/**
 * Une notification d'un type inconnu ne doit pas disparaître.
 *
 * Ces tables existaient en cinq exemplaires, sur deux fichiers. Ajouter un
 * type obligeait à modifier six endroits, et rien n'obligeait à les modifier
 * tous : le compilateur voyait les tables typées, pas les divergences de
 * couleur entre deux copies.
 */

import { describe, expect, it } from "vitest"
import { idsAMarquerCommeVues, notificationTypeView } from "./type-view"

describe("l'apparence d'un type de notification", () => {
  it("nomme les deux temps de la chaîne d'inscription", () => {
    expect(notificationTypeView("enrollment_awaiting_payment").label).toBe("Versement attendu")
    expect(notificationTypeView("enrollment_awaiting_validation").label).toBe(
      "Inscription à valider",
    )
  })

  it("donne la même teinte aux deux, parce que ce sont des tâches à faire", () => {
    const versement = notificationTypeView("enrollment_awaiting_payment")
    const validation = notificationTypeView("enrollment_awaiting_validation")
    expect(versement.tone).toBe(validation.tone)
    // L'ambre est ce que le reste du produit emploie pour « il reste
    // quelque chose à poser », par opposition au vert d'un fait acquis.
    expect(versement.tone).toContain("amber")
    expect(notificationTypeView("payment_received").tone).toContain("emerald")
  })

  it("ne fait pas disparaître une notification d'un type qu'il ne connaît pas", () => {
    // Le serveur peut prendre de l'avance sur le client : mieux vaut une
    // apparence neutre qu'une alerte invisible.
    const inconnu = notificationTypeView("type_ajoute_demain")
    expect(inconnu.label).toBeTruthy()
    expect(inconnu.Icon).toBeDefined()
  })

  it("donne à chaque type connu une icône et un libellé", () => {
    for (const t of [
      "payment_due", "payment_received", "grade_available", "bulletin_published",
      "absence_recorded", "enrollment_status", "system",
      "enrollment_awaiting_payment", "enrollment_awaiting_validation",
    ]) {
      const vue = notificationTypeView(t)
      expect(vue.label.length).toBeGreaterThan(0)
      expect(vue.tone).toMatch(/^bg-/)
    }
  })
})

describe("ce que la cloche marque en s'ouvrant", () => {
  const n = (id: number, read: boolean) => ({ id, read })

  it("ne retient que les non-lues effectivement affichées", () => {
    // La quatrième est plus bas dans le stock : elle n'est pas affichée,
    // donc elle reste à voir. C'est tout l'objet de ce marquage ciblé.
    expect(idsAMarquerCommeVues([n(1, false), n(2, false), n(3, true)])).toEqual([1, 2])
  })

  it("ne demande rien quand tout ce qui est affiché est déjà lu", () => {
    // Une liste vide évite un aller-retour serveur inutile à chaque
    // ouverture de la cloche.
    expect(idsAMarquerCommeVues([n(1, true), n(2, true)])).toEqual([])
  })

  it("tolère l'absence de données", () => {
    expect(idsAMarquerCommeVues(undefined)).toEqual([])
  })
})
