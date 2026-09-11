import { describe, expect, it } from "vitest"
import { peutRecevoirDeLArgent } from "@/lib/contracts/payment"

/**
 * Le miroir de `_can_receive_cash` côté serveur.
 *
 * Deux conditions, et il faut les deux. Écrire l'une sans l'autre fait
 * proposer, dans la boîte de réimputation, un frais que la caisse refusera —
 * et l'écran promet alors ce que le serveur va défaire.
 */
describe("peutRecevoirDeLArgent", () => {
  it("accepte une ligne due qui a encore un reste", () => {
    expect(peutRecevoirDeLArgent("pending", 3000)).toBe(true)
    expect(peutRecevoirDeLArgent("partial", 500)).toBe(true)
  })

  it("refuse une ligne soldée, même si son reste paraît positif", () => {
    // Le cas que le reste seul laisserait passer : un frais payé dont les
    // versements ne sont pas encore relus paraîtrait redevable.
    expect(peutRecevoirDeLArgent("paid", 3000)).toBe(false)
  })

  it("refuse une ligne due dont le reste est tombé à zéro", () => {
    expect(peutRecevoirDeLArgent("pending", 0)).toBe(false)
    expect(peutRecevoirDeLArgent("partial", 0)).toBe(false)
  })

  it("refuse ce qui n'est plus dû en argent", () => {
    expect(peutRecevoirDeLArgent("waived", 3000)).toBe(false)
    expect(peutRecevoirDeLArgent("in_kind", 3000)).toBe(false)
  })

  it("refuse un statut qu'il ne connaît pas", () => {
    // Le défaut prudent : ne pas proposer de poser de l'argent sur une ligne
    // dont on ne sait pas ce qu'elle attend.
    expect(peutRecevoirDeLArgent("un_statut_futur", 3000)).toBe(false)
  })
})
