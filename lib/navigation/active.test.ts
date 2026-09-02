import { describe, expect, it } from "vitest"
import { correspond, plusPrecise } from "./active"

describe("l'entrée du menu où l'on se trouve", () => {
  it("reconnaît le chemin exact", () => {
    expect(correspond("/admin/payments", "/admin/payments")).toBe(true)
  })

  it("reconnaît une page fille", () => {
    expect(correspond("/admin/payments/soldes", "/admin/payments")).toBe(true)
  })

  it("ne confond pas deux chemins qui commencent pareil", () => {
    // « /admin/paymentsX » n'est pas sous « /admin/payments » : sans le
    // séparateur, un futur écran nommé ainsi allumerait la mauvaise entrée.
    expect(correspond("/admin/payments-archive", "/admin/payments")).toBe(false)
  })

  it("laisse gagner le chemin le plus précis", () => {
    // C'est tout l'intérêt : sur la page des soldes, le journal des versements
    // ne doit pas s'allumer aussi, sinon on ne sait plus laquelle on lit.
    expect(
      plusPrecise("/admin/payments/soldes", ["/admin/payments", "/admin/payments/soldes"]),
    ).toBe("/admin/payments/soldes")
  })

  it("garde le parent quand on est sur lui", () => {
    expect(
      plusPrecise("/admin/payments", ["/admin/payments", "/admin/payments/soldes"]),
    ).toBe("/admin/payments")
  })

  it("n'allume rien sur une page que le menu ne connaît pas", () => {
    expect(plusPrecise("/admin/grades", ["/admin/payments"])).toBeNull()
  })
})
