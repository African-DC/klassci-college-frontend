import { describe, expect, it } from "vitest"
import { filterAdminNavigation } from "./adminNav"

const accountant = [
  "payments:read",
  "payments:create",
  "enrollments:read",
  "reports:read",
]

// Le bureau de la vie scolaire : c'est lui qui délivre convocations et billets
// d'annulation de zéro. Le directeur des études, lui, signe la demande de
// dossier scolaire — pas ces deux actes.
// Les droits reels du role, tels que `tenants/permissions.py` les seme et que
// la migration 0042 les a poses sur les bases existantes. Cette liste avait
// derive : elle omettait `enrollments:create`, `update` et `validate`, et
// laissait croire que l'educateur ne pouvait rien ecrire.
const educator = [
  "enrollments:read",
  "enrollments:create",
  "enrollments:update",
  "enrollments:validate",
  "admin:students:read",
  "admin:classes:read",
  "attendance:read",
  "reports:read",
  "documents:entry-slip",
  "documents:parent-summons",
  "documents:zero-cancellation",
  "leave:request",
]

const studiesDirector = [
  "admin:classes:read",
  "admin:students:read",
  "admin:teachers:read",
  "enrollments:read",
  "timetable:read",
  "grades:read",
  "attendance:read",
  "reports:read",
  "performance:read",
  "documents:school-file-request",
  "leave:approve",
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

  it("gives the school-life acts to the educator", () => {
    const seen = labels(educator)
    expect(seen).toContain("Convocations")
    expect(seen).toContain("Autorisations de reprise")
  })

  it("gives the educator the batch entry screen he is the user of", () => {
    // L'ecran de saisie par classe existe pour lui : soixante-dix-huit
    // inscriptions a renseigner, fiche par fiche, ne se terminent pas. Une
    // entree de menu qu'il ne verrait pas rendrait la fonctionnalite
    // introuvable pour son seul utilisateur.
    expect(labels(educator)).toContain("Saisie par classe")
    expect(labels(accountant)).not.toContain("Saisie par classe")
  })

  it("hides the school-life acts from the directeur des etudes", () => {
    // Il lit le cahier de notes et pilote le pédagogique, mais il ne tient pas
    // le registre de la vie scolaire : ces deux entrées ne sont pas les
    // siennes, malgré ce qu'un commentaire du menu a longtemps prétendu.
    const seen = labels(studiesDirector)
    expect(seen).toContain("Notes")
    expect(seen).not.toContain("Convocations")
    expect(seen).not.toContain("Autorisations de reprise")
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

