import { describe, expect, it } from "vitest"
import { countFeeLines } from "@/lib/enrollment/fee-lines"

describe("Le décompte des lignes de frais", () => {
  it("sépare ce qui porte un versement de ce qui n'en porte pas", () => {
    const counts = countFeeLines([
      { status: "pending", paid: 0 },
      { status: "partial", paid: 5000 },
      { status: "paid", paid: 30000 },
    ])

    expect(counts).toEqual({ withPayments: 2, withoutPayments: 1, settledWithoutCash: 0 })
  })

  /**
   * Une ligne exonérée ou déposée en nature n'a reçu aucun versement, et
   * pourtant elle est soldée. La ranger avec les lignes en attente ferait dire
   * à la confirmation qu'elle sera remplacée.
   */
  it("range l'exonéré et le déposé en nature à part", () => {
    const counts = countFeeLines([
      { status: "waived", paid: 0 },
      { status: "in_kind", paid: 0 },
      { status: "pending", paid: 0 },
    ])

    expect(counts).toEqual({ withPayments: 0, withoutPayments: 1, settledWithoutCash: 2 })
  })

  it("ne compte rien quand il n'y a rien", () => {
    expect(countFeeLines([])).toEqual({
      withPayments: 0,
      withoutPayments: 0,
      settledWithoutCash: 0,
    })
  })
})
