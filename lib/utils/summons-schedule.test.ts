import { describe, expect, it } from "vitest"
import { canRecordSummonsOutcome, todayIso } from "./summons-schedule"

describe("todayIso", () => {
  it("formate en AAAA-MM-JJ avec les zéros de tête", () => {
    expect(todayIso(new Date(2026, 0, 5))).toBe("2026-01-05")
    expect(todayIso(new Date(2026, 11, 31))).toBe("2026-12-31")
  })
})

describe("canRecordSummonsOutcome", () => {
  const today = "2026-08-21"

  it("refuse un rendez-vous à venir : le backend le rejette de toute façon", () => {
    expect(canRecordSummonsOutcome("2026-08-22", today)).toBe(false)
    expect(canRecordSummonsOutcome("2026-09-01", today)).toBe(false)
    expect(canRecordSummonsOutcome("2027-01-04", today)).toBe(false)
  })

  it("autorise dès le jour même", () => {
    expect(canRecordSummonsOutcome("2026-08-21", today)).toBe(true)
  })

  it("autorise un rendez-vous passé", () => {
    expect(canRecordSummonsOutcome("2026-08-20", today)).toBe(true)
    expect(canRecordSummonsOutcome("2025-12-31", today)).toBe(true)
  })

  it("tolère un horodatage complet renvoyé par le backend", () => {
    expect(canRecordSummonsOutcome("2026-08-21T00:00:00", today)).toBe(true)
    expect(canRecordSummonsOutcome("2026-08-22T00:00:00", today)).toBe(false)
  })

  it("ne bloque pas une date manquante : ce n'est pas au registre d'inventer", () => {
    expect(canRecordSummonsOutcome("", today)).toBe(true)
  })
})
