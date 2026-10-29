import { describe, expect, it } from "vitest"
import { canReportFrom } from "./support-link"

describe("canReportFrom", () => {
  it("autorise le portail admin", () => {
    expect(canReportFrom("/admin/students")).toBe(true)
  })
  it("refuse les autres portails et l'absence de chemin", () => {
    expect(canReportFrom("/teacher/grades")).toBe(false)
    expect(canReportFrom("/parent/dashboard")).toBe(false)
    expect(canReportFrom(null)).toBe(false)
  })
})
