import { describe, expect, it } from "vitest"
import { buildAccountingScope, isValidAccountingDate } from "./payment-accounting-scope"

describe("accounting scope", () => {
  it("filters only current-year enrollment payments", () => {
    expect(buildAccountingScope("current_year", 7, "2026-10-13")).toEqual({ academic_year_id: 7 })
  })
  it("does not filter previous-year arrears out of today's cash", () => {
    expect(buildAccountingScope("today", 7, "2026-10-13")).toEqual({
      date_from: "2026-10-13T00:00:00",
      date_to: "2026-10-13T23:59:59.999999",
    })
  })
  it("handles a specific date across all enrollment years", () => {
    expect(buildAccountingScope("date", 7, "2026-10-09")).toEqual({
      date_from: "2026-10-09T00:00:00",
      date_to: "2026-10-09T23:59:59.999999",
    })
  })
  it("covers Monday through Sunday, even across a month", () => {
    expect(buildAccountingScope("week", 7, "2026-10-01")).toEqual({
      date_from: "2026-09-28T00:00:00",
      date_to: "2026-10-04T23:59:59.999999",
    })
  })
  it("does not limit historical lookups to the current school year", () => {
    expect(buildAccountingScope("all", 7, "2026-10-13")).toEqual({})
  })
  it("rejects invalid and missing dates before querying the ledger", () => {
    expect(isValidAccountingDate("2026-02-30")).toBe(false)
    expect(isValidAccountingDate("")).toBe(false)
    expect(isValidAccountingDate("2026-10-13")).toBe(true)
    expect(buildAccountingScope("date", 7, "2026-02-30")).toEqual({})
  })
})
