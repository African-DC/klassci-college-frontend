/**
 * La vue de ligne est lue par le tableau et par les cartes.
 *
 * Elle décide de ce que la caissière voit, sur les deux appareils à la fois :
 * une erreur ici s'affiche deux fois, et une divergence entre les deux
 * lectures ne se verrait qu'en comparant un téléphone et un écran côte à côte.
 */

import { describe, expect, it } from "vitest"
import { paymentRowView } from "./paymentRowView"
import type { Payment } from "@/lib/contracts/payment"

function versement(champs: Partial<Payment> = {}): Payment {
  return {
    id: 1,
    amount: 3000,
    method: "cash",
    status: "completed",
    student_name: "Traoré Aminata",
    ...champs,
  } as Payment
}

describe("ce qu'une ligne du journal affiche", () => {
  it("tire les initiales du nom, prénom compris", () => {
    expect(paymentRowView(versement()).initials).toBe("TA")
  })

  it("s'en tient à deux lettres quand le nom en compte plus", () => {
    expect(paymentRowView(versement({ student_name: "Kouadio Yao N'Guessan" })).initials).toBe("KY")
  })

  it("affiche un point d'interrogation plutôt qu'un vide quand le nom manque", () => {
    expect(paymentRowView(versement({ student_name: null })).initials).toBe("?")
  })

  it("ne dit rien de plus sur un versement valide", () => {
    expect(paymentRowView(versement()).cancellation).toBeNull()
  })

  it("dit quand, par qui et pourquoi sur un versement annulé", () => {
    const vue = paymentRowView(versement({
      status: "cancelled",
      cancelled_at: "2026-08-23T17:15:27",
      cancelled_by_name: "Admin KLASSCI",
      cancellation_reason: "Double saisie du COGES",
    }))
    expect(vue.cancellation).toBe("Annulé le 23/08/2026 par Admin KLASSCI · Double saisie du COGES")
    expect(vue.statusLabel).toBe("Annulé")
  })

  it("se tait sur une annulation antérieure au motif obligatoire", () => {
    // Le badge dit déjà « Annulé » : sans motif, la ligne se contenterait de
    // le répéter. C'est le comportement d'avant l'extraction, pas un choix neuf.
    const vue = paymentRowView(versement({ status: "cancelled", cancelled_at: "2026-01-04T09:00:00" }))
    expect(vue.cancellation).toBeNull()
    expect(vue.statusLabel).toBe("Annulé")
  })

  it("tolère un motif sans auteur ni date", () => {
    const vue = paymentRowView(versement({ status: "cancelled", cancellation_reason: "Saisie en trop" }))
    expect(vue.cancellation).toBe("Annulé · Saisie en trop")
  })

  it("nomme la méthode de paiement et lui donne son icône", () => {
    const mobile = paymentRowView(versement({ method: "mobile_money" }))
    const especes = paymentRowView(versement({ method: "cash" }))
    expect(mobile.methodLabel).toMatch(/Mobile Money/i)
    expect(especes.methodLabel).toMatch(/esp/i)
    // Deux méthodes se distinguent au premier coup d'œil par leur icône :
    // c'est la colonne qu'on parcourt pour retrouver un versement en espèces.
    expect(mobile.MethodIcon).toBeDefined()
    expect(mobile.MethodIcon).not.toBe(especes.MethodIcon)
  })

  it("donne à chaque statut sa pastille et son libellé", () => {
    for (const [statut, libelle] of [
      ["pending", "En attente"],
      ["completed", "Validé"],
      ["failed", "Échoué"],
      ["refunded", "Remboursé"],
      ["cancelled", "Annulé"],
    ] as const) {
      const vue = paymentRowView(versement({ status: statut }))
      expect(vue.statusLabel).toBe(libelle)
      expect(vue.statusDot).toMatch(/^bg-/)
    }
  })
})
