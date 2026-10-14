/**
 * Vider la nationalité l'efface : le champ part à `null`, pas à une chaîne
 * vide que le serveur enregistrerait comme une nationalité « vide ».
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const envoyer = vi.hoisted(() => vi.fn())

vi.mock("@/lib/hooks/useStudents", () => ({
  useStudent: () => ({
    isLoading: false,
    data: {
      id: 5,
      first_name: "Awa",
      last_name: "Koné",
      birth_date: null,
      birth_place: null,
      nationality: "Ivoirienne",
      genre: "F",
      enrollment_number: "R-001",
      user_id: null,
    },
  }),
  useUpdateStudent: () => ({ mutate: envoyer, isPending: false, error: null }),
}))
vi.mock("@/lib/hooks/useFormDuplicates", () => ({
  useFormDuplicates: () => ({ matches: [], pending: false, failed: false }),
}))

import { StudentEditModal } from "./StudentEditModal"

describe("la nationalité sur la fiche élève", () => {
  it("part à null quand on la vide", async () => {
    render(<StudentEditModal studentId={5} open onClose={() => {}} />)
    const champ = screen.getByRole("combobox", { name: "Nationalité" })
    expect(champ).toHaveTextContent("Ivoirienne")
    fireEvent.click(champ)
    fireEvent.click(await screen.findByRole("button", { name: "Effacer la sélection" }))
    fireEvent.click(screen.getByRole("button", { name: "Mettre à jour" }))

    await waitFor(() => expect(envoyer).toHaveBeenCalledOnce())
    expect(envoyer.mock.calls[0][0]).toMatchObject({ nationality: null })
  })

  it("retrouve une nationalité en recherchant le nom du pays", async () => {
    render(<StudentEditModal studentId={5} open onClose={() => {}} />)
    fireEvent.click(screen.getByRole("combobox", { name: "Nationalité" }))
    const search = await screen.findByPlaceholderText("Rechercher une nationalité ou un pays…")
    fireEvent.change(search, { target: { value: "cote d ivoire" } })
    expect(screen.getByRole("button", { name: "Ivoirienne" })).toBeInTheDocument()
  })
})
