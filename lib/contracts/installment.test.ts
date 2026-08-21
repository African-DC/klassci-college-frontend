import { describe, expect, it } from "vitest"
import {
  fixedTotal,
  hasPercentageLine,
  isGridComplete,
  percentageTotal,
  simulateGrid,
  type InstallmentDraft,
} from "./installment"

/**
 * La simulation affichée avant enregistrement doit donner exactement ce que le
 * serveur calculera. Si les deux divergent, une directrice valide des chiffres
 * que les familles ne recevront jamais — et c'est précisément ce genre d'écart
 * qui a fait retenir des certificats pour des impayés inventés.
 */

function ligne(patch: Partial<InstallmentDraft>): InstallmentDraft {
  return {
    name: "Tranche",
    position: 1,
    kind: "percentage",
    percentage: null,
    amount: null,
    due_date: "2026-11-30",
    ...patch,
  }
}

const pct = (percentage: number) => ligne({ kind: "percentage", percentage })
const fixe = (amount: number) => ligne({ kind: "fixed", amount })

describe("simulateGrid", () => {
  it("reproduit le cas de la brochure au franc près", () => {
    // 6e non affectée : inscription 37 000 + scolarité 70 000 + tenue 18 000.
    const montants = simulateGrid(125000, [fixe(37000), pct(35), pct(35), pct(30)])
    expect(montants).toEqual([37000, 30800, 30800, 26400])
    expect(montants.reduce((a, b) => a + b, 0)).toBe(125000)
  })

  it("fait porter le pourcentage sur le reste, pas sur le total", () => {
    const montants = simulateGrid(125000, [fixe(37000), pct(35), pct(35), pct(30)])
    expect(montants[1]).not.toBe(43750)
  })

  it("laisse une grille en pourcentages produire exactement ce qu'elle produisait", () => {
    expect(simulateGrid(125000, [pct(35), pct(35), pct(30)])).toEqual([43750, 43750, 37500])
    expect(simulateGrid(200000, [pct(40), pct(30), pct(30)])).toEqual([80000, 60000, 60000])
  })

  it("fait absorber l'arrondi par la dernière tranche en pourcentage", () => {
    const montants = simulateGrid(100001, [fixe(1), pct(33.33), pct(33.33), pct(33.34)])
    expect(montants.reduce((a, b) => a + b, 0)).toBe(100001)
  })

  it("ne réclame jamais plus qu'un élève ne doit", () => {
    // Grille bâtie pour un non affecté, appliquée à un élève subventionné.
    expect(simulateGrid(60000, [fixe(37000), fixe(44000), fixe(44000)])).toEqual([37000, 23000, 0])
  })

  it("ne fait rien payer à un élève entièrement exonéré", () => {
    expect(simulateGrid(0, [fixe(37000), pct(100)])).toEqual([0, 0])
  })

  it("ne produit aucune échéance sans tranche", () => {
    expect(simulateGrid(125000, [])).toEqual([])
  })
})

describe("validité d'une grille", () => {
  it("exige 100 % dès qu'une tranche est en pourcentage", () => {
    expect(isGridComplete([fixe(37000), pct(35), pct(35), pct(30)])).toBe(true)
    expect(isGridComplete([fixe(37000), pct(35), pct(35)])).toBe(false)
  })

  it("accepte une grille faite uniquement de montants fixes", () => {
    expect(isGridComplete([fixe(37000), fixe(44000)])).toBe(true)
    expect(hasPercentageLine([fixe(37000), fixe(44000)])).toBe(false)
  })

  it("refuse une grille vide", () => {
    expect(isGridComplete([])).toBe(false)
  })

  it("ne compte que les pourcentages dans le total en pourcentage", () => {
    expect(percentageTotal([fixe(37000), pct(35), pct(65)])).toBe(100)
    expect(fixedTotal([fixe(37000), pct(35), fixe(44000)])).toBe(81000)
  })
})
