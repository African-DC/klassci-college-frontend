import { describe, expect, it } from "vitest"
import { filterAdminNavigation } from "./adminNav"

const accountant = [
  "payments:read",
  "payments:create",
  "enrollments:read",
  "reports:read",
]

const staff = [
  "enrollments:read",
  "enrollments:create",
  "enrollments:update",
  "payments:read",
  "payments:create",
  "admin:students:read",
  "admin:students:create",
  "admin:students:update",
  "admin:classes:read",
  "attendance:read",
  "reports:read",
  "leave:request",
]

function labels(permissions: string[]): string[] {
  return filterAdminNavigation(permissions).flatMap((section) => section.items.map((item) => item.label))
}

describe("filterAdminNavigation", () => {
  it("hides the whole menu until permissions are known", () => {
    expect(filterAdminNavigation(null)).toEqual([])
  })

  it("keeps dashboard and notifications for every staff role", () => {
    expect(labels(accountant)).toContain("Dashboard")
    expect(labels(accountant)).toContain("Notifications")
  })

  it("shows a comptable only finance and enrollment pages", () => {
    expect(labels(accountant)).toEqual([
      "Dashboard",
      "Inscriptions",
      "Paiements",
      "Bulletins",
      "Notifications",
    ])
    expect(labels(accountant)).not.toContain("Personnel")
    expect(labels(accountant)).not.toContain("Enseignants")
    expect(labels(accountant)).not.toContain("Notes")
  })

  it("shows secretariat enrollment and student pages but not staff admin", () => {
    const seen = labels(staff)
    expect(seen).toContain("Inscriptions")
    expect(seen).toContain("Élèves")
    expect(seen).toContain("Paiements")
    expect(seen).toContain("Classes")
    expect(seen).not.toContain("Personnel")
    expect(seen).not.toContain("Enseignants")
    expect(seen).not.toContain("Notes")
  })
})

