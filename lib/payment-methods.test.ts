import { describe, expect, it } from "vitest"
import {
  ALL_PAYMENT_METHODS,
  SELECTABLE_PAYMENT_METHODS,
  orderPaymentMethods,
  paymentMethodLabel,
} from "@/lib/payment-methods"
import { PaymentMethodSchema, PaymentMethodInputSchema } from "@/lib/contracts/payment"

describe("Table des moyens de paiement", () => {
  it("nomme les opérateurs comme ils s'écrivent", () => {
    expect(paymentMethodLabel("wave")).toBe("Wave")
    expect(paymentMethodLabel("mtn_momo")).toBe("MTN MoMo")
    expect(paymentMethodLabel("orange_money")).toBe("Orange Money")
    expect(paymentMethodLabel("moov_money")).toBe("Moov Money")
  })

  it("garde le libellé d'origine de la valeur historique", () => {
    // Un reçu réimprimé doit dire ce que la famille a sur son papier.
    expect(paymentMethodLabel("mobile_money")).toBe("Mobile Money")
  })

  it("range les moyens par fréquence au guichet, pas par alphabet", () => {
    expect(orderPaymentMethods(["cheque", "wave", "cash", "moov_money"])).toEqual([
      "cash",
      "wave",
      "moov_money",
      "cheque",
    ])
  })

  it("ne perd jamais un moyen inconnu et ne le déguise pas", () => {
    const ordered = orderPaymentMethods(["cash", "un_moyen_inattendu"])
    expect(ordered).toEqual(["cash", "un_moyen_inattendu"])
    // Repli sur la clé brute plutôt qu'un « Autre » qui ferait mentir la ligne.
    expect(paymentMethodLabel("un_moyen_inattendu")).toBe("un_moyen_inattendu")
  })
})

describe("Contrats de lecture et de saisie", () => {
  it("accepte un versement historique en lecture", () => {
    // Le refuser viderait les écrans de toute école ayant un historique.
    expect(PaymentMethodSchema.safeParse("mobile_money").success).toBe(true)
  })

  it("refuse la valeur historique à la saisie", () => {
    expect(PaymentMethodInputSchema.safeParse("mobile_money").success).toBe(false)
  })

  it("accepte les quatre opérateurs à la saisie", () => {
    for (const operator of ["wave", "mtn_momo", "orange_money", "moov_money"]) {
      expect(PaymentMethodInputSchema.safeParse(operator).success).toBe(true)
    }
  })

  it("garde lecture et saisie cohérentes avec les listes", () => {
    expect(SELECTABLE_PAYMENT_METHODS.length).toBe(7)
    expect(ALL_PAYMENT_METHODS.length).toBe(8)
    for (const method of ALL_PAYMENT_METHODS) {
      expect(PaymentMethodSchema.safeParse(method).success).toBe(true)
      expect(paymentMethodLabel(method)).not.toBe(method)
    }
  })
})
