/**
 * Le bouton d'annulation existe-t-il sur une ligne déjà encaissée ?
 *
 * Le défaut qui a vécu en production n'était pas dans une fonction : il était
 * dans le JSX, un `payment.status === "pending" &&` posé autour du bouton. Un
 * test du seul prédicat resterait vert si quelqu'un le réintroduisait demain.
 * Ceux-ci rendent les deux composants et cherchent le bouton — le tableau et
 * la carte tactile, car c'est au téléphone que la caissière travaille.
 *
 * Le versement de test passe par `PaymentSchema.parse` plutôt que par un
 * `as Payment` : un champ oublié doit faire échouer le test bruyamment, pas
 * arriver au composant en `undefined`.
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { PaymentCardActions } from "@/components/admin/payments/PaymentCardActions"
import { PaymentRowActions } from "@/components/admin/payments/PaymentRowActions"
import { PaymentSchema, type PaymentStatus } from "@/lib/contracts/payment"

function payment(status: PaymentStatus, studentName: string | null = "Aminata Traoré") {
  return PaymentSchema.parse({
    id: 42,
    enrollment_id: 7,
    amount: 5000,
    method: "cash",
    status,
    reference: null,
    student_name: studentName,
    created_at: "2026-08-23T10:00:00",
    updated_at: "2026-08-23T10:00:00",
  })
}

const renderRow = (status: PaymentStatus) =>
  render(
    <PaymentRowActions
      payment={payment(status)}
      onValidate={vi.fn()}
      onCancel={vi.fn()}
      onPreviewReceipt={vi.fn()}
    />,
  )

const renderCard = (status: PaymentStatus, studentName?: string | null) =>
  render(
    <PaymentCardActions
      payment={payment(status, studentName)}
      onValidate={vi.fn()}
      onCancel={vi.fn()}
    />,
  )

const cancelButton = () => screen.queryByRole("button", { name: /Annuler le versement/i })
const validateButton = () => screen.queryByRole("button", { name: /Valider le versement/i })

describe("les gestes sur une ligne du tableau", () => {
  it("propose la correction d'un versement déjà encaissé", () => {
    // L'assertion qui porte tout : c'est ce bouton que l'écran ne montrait pas.
    renderRow("completed")
    expect(cancelButton()).toBeInTheDocument()
  })

  it("propose encore valider et annuler sur un versement en attente", () => {
    renderRow("pending")
    expect(validateButton()).toBeInTheDocument()
    expect(cancelButton()).toBeInTheDocument()
  })

  it("ne laisse que le reçu sur un versement déjà annulé", () => {
    renderRow("cancelled")
    expect(cancelButton()).toBeNull()
    expect(validateButton()).toBeNull()
    expect(screen.getByRole("button", { name: /Voir le reçu/i })).toBeInTheDocument()
  })
})

describe("les gestes sous une carte tactile", () => {
  it("propose la correction d'un versement déjà encaissé", () => {
    renderCard("completed")
    expect(cancelButton()).toBeInTheDocument()
  })

  it("n'affiche aucun pied de carte quand il n'y a plus rien à faire", () => {
    const { container } = renderCard("cancelled")
    expect(container).toBeEmptyDOMElement()
  })

  it("ne répète pas le reçu, que la carte entière ouvre déjà", () => {
    renderCard("completed")
    expect(screen.queryByRole("button", { name: /reçu/i })).toBeNull()
  })

  it("nomme l'élève sans remplacer le libellé visible", () => {
    renderCard("completed")
    expect(
      screen.getByRole("button", { name: "Annuler le versement d'Aminata Traoré" }),
    ).toBeInTheDocument()
  })

  it("nomme le versement par son numéro quand l'élève manque", () => {
    // Sinon le lecteur d'écran disait « le versement de versement nº 42 ».
    renderCard("completed", null)
    expect(screen.getByRole("button", { name: "Annuler le versement nº 42" })).toBeInTheDocument()
  })
})
