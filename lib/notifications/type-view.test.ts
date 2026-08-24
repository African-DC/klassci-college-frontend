/**
 * Une notification d'un type inconnu ne doit pas disparaître.
 *
 * Ces tables existaient en cinq exemplaires, sur deux fichiers. Ajouter un
 * type obligeait à modifier six endroits, et rien n'obligeait à les modifier
 * tous : le compilateur voyait les tables typées, pas les divergences de
 * couleur entre deux copies.
 */

import { z } from "zod"
import { describe, expect, it } from "vitest"
import { NotificationSchema } from "@/lib/contracts/notification"
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
    // Ce test passait déjà avant, en appelant la fonction directement — et il
    // affirmait donc une propriété que le produit n'avait pas : le schéma
    // était un enum strict, `safeValidate` levait, et une seule notification
    // inconnue faisait disparaître toute la liste. Il traverse maintenant la
    // couche qui cassait.
    const brut = {
      id: 1, user_id: 1, type: "type_ajoute_demain", channel: "in_app",
      title: "Nouveau", body: "…", read: false, sent_at: null, read_at: null,
      entity_type: null, entity_id: null, action_url: null,
      created_at: new Date().toISOString(),
    }
    const valide = NotificationSchema.parse(brut)
    const vue = notificationTypeView(valide.type)
    expect(vue.label).toBeTruthy()
    expect(vue.Icon).toBeDefined()
  })

  it("laisse passer une liste où une seule notification est d'un type inconnu", () => {
    // Le cas qui comptait vraiment : une inconnue ne doit pas emporter les
    // autres.
    const ligne = (type: string, id: number) => ({
      id, user_id: 1, type, channel: "in_app", title: `T${id}`, body: "…",
      read: false, sent_at: null, read_at: null, entity_type: null,
      entity_id: null, action_url: null, created_at: new Date().toISOString(),
    })
    const liste = z.array(NotificationSchema).parse([
      ligne("payment_due", 1),
      ligne("type_ajoute_demain", 2),
      ligne("system", 3),
    ])
    expect(liste).toHaveLength(3)
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
