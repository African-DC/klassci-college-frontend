import { describe, expect, it } from "vitest"
import { FeeDiscountUpsertSchema, calculateFeeDiscount } from "./fee-discount"

describe("réductions individuelles", () => {
  it("calcule une réduction fixe ou proportionnelle", () => {
    expect(calculateFeeDiscount(150000, { kind: "fixed", value: 25000, reason: "Aide sociale" })).toBe(25000)
    expect(calculateFeeDiscount(150000, { kind: "percent", value: 20, reason: "Aide sociale" })).toBe(30000)
  })
  it("rejette un pourcentage excessif et les motifs insuffisants", () => {
    expect(FeeDiscountUpsertSchema.safeParse({
      kind: "percent", value: 101, reason: "Aide sociale",
    }).success).toBe(false)
    expect(FeeDiscountUpsertSchema.safeParse({
      kind: "fixed", value: 20000, reason: "Non",
    }).success).toBe(false)
  })
})
