/**
 * La bourse d'une inscription : ce qui la déclare ou la retire est réservé à
 * `scholarships:manage`, et le retrait passe par une confirmation qui dit ce
 * que la fiche affichera ensuite.
 */
import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Enrollment } from "@/lib/contracts/enrollment"

const retirer = vi.hoisted(() => vi.fn())
const droits = vi.hoisted(() => ({ slugs: ["scholarships:manage"] as string[] }))

vi.mock("@/lib/hooks/usePermissions", () => ({
  usePermissions: () => ({ has: (slug: string) => droits.slugs.includes(slug) }),
}))
vi.mock("@/lib/hooks/useEnrollmentProfile", () => ({
  useRemoveScholarship: () => ({ mutate: retirer, isPending: false }),
  useSetScholarship: () => ({ mutate: vi.fn(), isPending: false }),
}))

import { ScholarshipCard } from "./ScholarshipCard"

const base = {
  id: 42,
  student_id: 5,
  class_id: 3,
  academic_year_id: 1,
  academic_year_name: "2026-2027",
  status: "valide",
  fee_variant_id: null,
  notes: null,
  created_by: 1,
  created_at: "2026-09-01T08:00:00Z",
  updated_at: "2026-09-01T08:00:00Z",
} satisfies Partial<Enrollment>

const boursier: Enrollment = {
  ...base,
  scholarship: { kind: "demi_bourse", provider: "État", decision_number: "D-2026-17" },
}

describe("la bourse sur la fiche inscription", () => {
  beforeEach(() => {
    retirer.mockClear()
    droits.slugs = ["scholarships:manage"]
  })

  it("affiche la bourse et la retire après confirmation", () => {
    render(<ScholarshipCard enrollment={boursier} studentName="Awa Koné" />)
    expect(screen.getByText("Boursier · Demi-bourse")).toBeInTheDocument()
    expect(screen.getByText("D-2026-17")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Retirer la bourse" }))
    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByText(/Awa Koné apparaîtra « Non boursier »/)).toBeInTheDocument()
    expect(retirer).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole("button", { name: "Retirer la bourse" }))
    expect(retirer).toHaveBeenCalledOnce()
  })

  it("n'envoie rien quand on renonce", () => {
    render(<ScholarshipCard enrollment={boursier} studentName="Awa Koné" />)
    fireEvent.click(screen.getByRole("button", { name: "Retirer la bourse" }))
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Retour" }))
    expect(retirer).not.toHaveBeenCalled()
  })

  it("dit « Non boursier » sans bourse, et ne propose rien sans le droit", () => {
    droits.slugs = []
    render(<ScholarshipCard enrollment={{ ...base, scholarship: null }} studentName="Awa Koné" />)
    expect(screen.getByText("Non boursier")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /bourse/i })).toBeNull()
  })
})
