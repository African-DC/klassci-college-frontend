/**
 * « Modifier l'inscription » permet de dire si l'élève est nouveau ou ancien.
 *
 * Retour de l'école Rostan : la fenêtre ne proposait pas le profil, qui ne se
 * corrigeait que par un badge à part sur la fiche. On rend la vraie fenêtre, on
 * choisit un profil, et on regarde ce qui part au serveur.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const envoyer = vi.hoisted(() => vi.fn())

vi.mock("@/lib/hooks/useEnrollments", () => ({
  useEnrollment: () => ({
    isLoading: false,
    data: {
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
      assignment_status: null,
      assignment_decision_number: null,
      is_new_student: null,
    },
  }),
  useUpdateEnrollment: () => ({ mutate: envoyer, isPending: false, error: null }),
}))
vi.mock("@/lib/hooks/useClasses", () => ({
  useClasses: () => ({ isLoading: false, data: { items: [{ id: 3, name: "6eme 1" }] } }),
}))

import { EnrollmentEditModal } from "./EnrollmentEditModal"

describe("modifier le profil d'une inscription", () => {
  it("propose nouvel élève, déjà inscrit ici avant, ou non tranché", () => {
    render(<EnrollmentEditModal enrollmentId={42} open onClose={() => {}} />)
    expect(screen.getByRole("button", { name: /Nouvel élève/ })).toBeTruthy()
    expect(screen.getByRole("button", { name: /Déjà inscrit ici avant/ })).toBeTruthy()
    expect(screen.getByRole("button", { name: /Non tranché/ })).toBeTruthy()
  })

  it("prévient que les frais seront recalculés, puis envoie le profil choisi", async () => {
    render(<EnrollmentEditModal enrollmentId={42} open onClose={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: /Déjà inscrit ici avant/ }))
    expect(screen.getByText(/seront\s+recalculés/)).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Mettre à jour" }))
    await waitFor(() => expect(envoyer).toHaveBeenCalledOnce())
    expect(envoyer.mock.calls[0][0]).toMatchObject({ is_new_student: false })
  })
})
