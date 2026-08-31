import { describe, expect, it } from "vitest"
import {
  buildAllocationPlan,
  parseAmount,
  toAllocationPayload,
} from "./allocation-plan"
import type { AllocationPreviewLine } from "@/lib/contracts/payment"

function ligne(over: Partial<AllocationPreviewLine> & { enrollment_fee_id: number }): AllocationPreviewLine {
  return {
    fee_category_name: "Frais",
    fee_category_priority: 1,
    fee_total: 0,
    fee_paid_before: 0,
    allocated: 0,
    fee_paid_after: 0,
    status_after: "pending",
    ...over,
  }
}

// Le cas dit par l'utilisateur : inscription 40 000 due, tenue 20 000 due.
const INSCRIPTION = ligne({
  enrollment_fee_id: 1,
  fee_category_name: "Inscription",
  fee_category_priority: 1,
  fee_total: 40_000,
})
const TENUE = ligne({
  enrollment_fee_id: 2,
  fee_category_name: "Tenue",
  fee_category_priority: 2,
  fee_total: 20_000,
})

describe("parseAmount", () => {
  it("lit un montant tapé avec des espaces de milliers", () => {
    expect(parseAmount("30 000")).toBe(30_000)
  })

  it("accepte la virgule décimale", () => {
    expect(parseAmount("1500,50")).toBe(1500.5)
  })

  it("rend zéro plutôt que NaN sur une saisie illisible", () => {
    expect(parseAmount("abc")).toBe(0)
    expect(parseAmount("")).toBe(0)
    expect(parseAmount(undefined)).toBe(0)
    expect(parseAmount("-500")).toBe(0)
  })
})

describe("buildAllocationPlan", () => {
  it("sans saisie, tout cascade par priorité", () => {
    const plan = buildAllocationPlan([TENUE, INSCRIPTION], {}, 50_000)

    expect(plan.lines.map((l) => l.name)).toEqual(["Inscription", "Tenue"])
    expect(plan.lines[0].auto).toBe(40_000)
    expect(plan.lines[1].auto).toBe(10_000)
    expect(plan.manualTotal).toBe(0)
    expect(plan.toDistribute).toBe(50_000)
    expect(plan.surplus).toBe(0)
    expect(plan.valid).toBe(true)
  })

  it("pose 30 000 sur l'inscription et laisse le reste aller où il doit", () => {
    const plan = buildAllocationPlan([INSCRIPTION, TENUE], { 1: "30 000" }, 50_000)

    expect(plan.manualTotal).toBe(30_000)
    expect(plan.toDistribute).toBe(20_000)
    // Le reliquat finit de solder l'inscription avant de toucher la tenue.
    expect(plan.lines[0].auto).toBe(10_000)
    expect(plan.lines[1].auto).toBe(10_000)
    expect(plan.autoTotal).toBe(20_000)
    expect(plan.surplus).toBe(0)
  })

  it("répartit tout à la main : plus rien à cascader", () => {
    const plan = buildAllocationPlan(
      [INSCRIPTION, TENUE],
      { 1: "40000", 2: "10000" },
      50_000,
    )

    expect(plan.toDistribute).toBe(0)
    expect(plan.autoTotal).toBe(0)
    expect(plan.lines.every((l) => l.auto === 0)).toBe(true)
    expect(plan.valid).toBe(true)
  })

  it("signale une saisie qui dépasse le montant du versement", () => {
    const plan = buildAllocationPlan(
      [INSCRIPTION, TENUE],
      { 1: "40000", 2: "20000" },
      50_000,
    )

    expect(plan.overAllocated).toBe(true)
    expect(plan.valid).toBe(false)
    expect(plan.toDistribute).toBe(0)
  })

  it("signale une saisie qui dépasse le reste dû d'un frais", () => {
    const plan = buildAllocationPlan([INSCRIPTION, TENUE], { 2: "25000" }, 50_000)

    expect(plan.lines[1].overDue).toBe(true)
    expect(plan.hasLineError).toBe(true)
    expect(plan.valid).toBe(false)
  })

  it("ne cascade rien sur un frais exonéré ou réglé en nature", () => {
    const exonere = ligne({
      enrollment_fee_id: 3,
      fee_category_name: "Cantine",
      fee_category_priority: 0,
      fee_total: 30_000,
      status_after: "waived",
    })
    const nature = ligne({
      enrollment_fee_id: 4,
      fee_category_name: "COGES",
      fee_category_priority: 3,
      fee_total: 5_000,
      status_after: "in_kind",
    })

    const plan = buildAllocationPlan([exonere, INSCRIPTION, TENUE, nature], {}, 100_000)

    expect(plan.lines[0].due).toBe(0)
    expect(plan.lines[0].auto).toBe(0)
    expect(plan.lines[3].auto).toBe(0)
    // 40 000 + 20 000 imputés, le reste n'a plus où aller.
    expect(plan.autoTotal).toBe(60_000)
    expect(plan.surplus).toBe(40_000)
  })

  it("tient compte de ce qui est déjà payé sur un frais", () => {
    const partiel = ligne({
      enrollment_fee_id: 5,
      fee_category_name: "Scolarité",
      fee_category_priority: 1,
      fee_total: 100_000,
      fee_paid_before: 70_000,
      status_after: "partial",
    })

    const plan = buildAllocationPlan([partiel], {}, 50_000)

    expect(plan.lines[0].due).toBe(30_000)
    expect(plan.lines[0].auto).toBe(30_000)
    expect(plan.surplus).toBe(20_000)
  })
})

describe("toAllocationPayload", () => {
  it("n'envoie que les montants nommés, jamais le reliquat", () => {
    const plan = buildAllocationPlan([INSCRIPTION, TENUE], { 1: "30000" }, 50_000)

    expect(toAllocationPayload(plan)).toEqual([
      { enrollment_fee_id: 1, amount: 30_000 },
    ])
  })

  it("rend une liste vide quand rien n'est nommé", () => {
    const plan = buildAllocationPlan([INSCRIPTION, TENUE], { 1: "", 2: "0" }, 50_000)

    expect(toAllocationPayload(plan)).toEqual([])
  })
})
