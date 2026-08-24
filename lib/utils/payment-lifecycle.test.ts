/**
 * La règle d'affichage suit la table de transitions du serveur.
 *
 * Le défaut verrouillé ici a vécu en production : l'écran n'offrait le bouton
 * qu'aux versements `pending`, alors que `completed → cancelled` est
 * précisément le cas du montant encaissé en trop.
 */

import { describe, expect, it } from "vitest"
import { canCancelPayment, canValidatePayment, paymentSubject } from "./payment-lifecycle"

describe("quels versements se contre-passent", () => {
  it("accepte un versement déjà encaissé", () => {
    // L'assertion qui porte tout : c'est le cas que l'écran cachait.
    expect(canCancelPayment("completed")).toBe(true)
  })

  it("accepte encore le refus d'un versement en attente", () => {
    expect(canCancelPayment("pending")).toBe(true)
  })

  it("refuse tout état sur lequel le serveur ne revient plus", () => {
    for (const status of ["cancelled", "refunded", "failed"] as const) {
      expect(canCancelPayment(status)).toBe(false)
    }
  })
})

describe("comment on nomme un versement à voix haute", () => {
  it("élide devant une voyelle, accentuée comprise", () => {
    expect(paymentSubject({ id: 1, student_name: "Aminata Traoré" })).toBe("d'Aminata Traoré")
    expect(paymentSubject({ id: 1, student_name: "Émile Kouassi" })).toBe("d'Émile Kouassi")
  })

  it("garde « de » devant une consonne, Y initial compris", () => {
    expect(paymentSubject({ id: 1, student_name: "Kouassi N'Dri" })).toBe("de Kouassi N'Dri")
    // « d'Yao » serait une faute, et Yao est un des noms les plus portés ici.
    expect(paymentSubject({ id: 1, student_name: "Yao Kouadio" })).toBe("de Yao Kouadio")
  })

  it("nomme le versement par son numéro quand l'élève manque", () => {
    // Sans ce cas, le lecteur d'écran disait « le versement de versement nº 42 ».
    expect(paymentSubject({ id: 42, student_name: null })).toBe("nº 42")
    expect(paymentSubject({ id: 42 })).toBe("nº 42")
  })
})

describe("quels versements se valident", () => {
  it("n'accepte que ce qui n'est pas encore entré en caisse", () => {
    expect(canValidatePayment("pending")).toBe(true)
    for (const status of ["completed", "cancelled", "refunded", "failed"] as const) {
      expect(canValidatePayment(status)).toBe(false)
    }
  })
})
