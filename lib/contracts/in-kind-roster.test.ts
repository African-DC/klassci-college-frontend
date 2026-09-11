import { describe, expect, it } from "vitest"
import { gesteDepot, type DepositableFee } from "@/lib/contracts/in-kind-roster"

/**
 * Ce que l'écran a le droit de proposer sur un article.
 *
 * Le geste se décidait par un booléen « déposé ou non », et tout ce qui
 * n'était pas déposé recevait donc « Marquer déposé » — y compris une ligne
 * déjà réglée à la caisse, sur laquelle le serveur répond « un versement y est
 * déjà imputé ». Un bouton qui échoue toujours vaut moins que pas de bouton.
 */
const article = (status: string): DepositableFee => ({
  fee_id: 1,
  fee_category_id: 10,
  category_name: "Ramette",
  status,
})

describe("gesteDepot", () => {
  it("propose de déposer ce qui reste dû", () => {
    expect(gesteDepot(article("pending"))).toBe("deposer")
  })

  it("propose de défaire ce qui est déposé", () => {
    expect(gesteDepot(article("in_kind"))).toBe("annuler")
  })

  it.each(["paid", "partial", "waived"])("ne propose rien sur une ligne « %s »", (status) => {
    expect(gesteDepot(article(status))).toBe("aucun")
  })

  it("ne propose rien sur un état qu'il ne connaît pas", () => {
    // Un statut ajouté côté serveur ne doit pas se lire comme « à remettre » :
    // le défaut prudent est de ne rien offrir, pas d'offrir le geste le plus
    // engageant des deux.
    expect(gesteDepot(article("un_statut_futur"))).toBe("aucun")
  })
})
