/**
 * Le tableau et les cartes montrent-ils vraiment la même chose ?
 *
 * C'est toute la raison d'être de `paymentRowView` : la caissière consulte le
 * même journal sur l'ordinateur du secrétariat et sur son téléphone, et les
 * deux doivent dire la même chose du même versement. La fonction partagée est
 * testée à part ; ces tests-ci vérifient que les deux vues la lisent, ce qu'une
 * substitution manquée dans l'une des deux casserait sans bruit.
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PaymentsCardList } from "./PaymentsCardList"
import { PaymentsTable } from "./PaymentsTable"
import type { Payment } from "@/lib/contracts/payment"

const ANNULE = {
  id: 1820,
  amount: 3000,
  method: "mobile_money",
  status: "cancelled",
  student_name: "dago désiré",
  fee_category_name: "COGES",
  cancelled_at: "2026-08-23T17:15:27",
  cancelled_by_name: "Admin KLASSCI",
  cancellation_reason: "Double saisie du COGES",
} as unknown as Payment

const rien = () => {}

const VUES = [
  {
    nom: "le tableau",
    rendre: (p: Payment[]) => render(
      <PaymentsTable
        payments={p}
        downloadingId={null}
        onPreviewReceipt={rien}
        onValidate={rien}
        onCancel={rien}
      />,
    ),
  },
  {
    nom: "les cartes",
    rendre: (p: Payment[]) => render(
      <PaymentsCardList payments={p} onPreviewReceipt={rien} onValidate={rien} onCancel={rien} />,
    ),
  },
]

describe.each(VUES)("$nom", ({ rendre }) => {
  it("porte le statut du versement", () => {
    rendre([ANNULE])
    expect(screen.getAllByText("Annulé").length).toBeGreaterThan(0)
  })

  it("dit quand, par qui et pourquoi le versement a été annulé", () => {
    rendre([ANNULE])
    expect(
      screen.getByText("Annulé le 23/08/2026 par Admin KLASSCI · Double saisie du COGES"),
    ).toBeTruthy()
  })

  it("nomme la méthode de paiement", () => {
    rendre([ANNULE])
    expect(screen.getAllByText(/Mobile Money/i).length).toBeGreaterThan(0)
  })

  it("se tait sur une annulation sans motif, que le badge dit déjà", () => {
    const sansMotif = { ...ANNULE, cancellation_reason: null } as unknown as Payment
    rendre([sansMotif])
    expect(screen.queryByText(/^Annulé le /)).toBeNull()
  })

  it("affiche les initiales de l'élève", () => {
    rendre([ANNULE])
    expect(screen.getAllByText("DD").length).toBeGreaterThan(0)
  })
})
