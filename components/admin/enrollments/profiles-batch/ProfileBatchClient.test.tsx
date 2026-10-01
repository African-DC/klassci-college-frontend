/**
 * La saisie par classe n'envoie que les élèves modifiés, et dans chacun
 * seulement les champs changés. On rend le vrai écran, on change la qualité
 * d'un seul élève, et on regarde ce qui part au serveur.
 */
import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { InformationSheetRow } from "@/lib/contracts/information-sheet"

const envoyer = vi.hoisted(() => vi.fn())
const etat = vi.hoisted(() => ({ error: null as unknown }))

function row(id: number, last: string, patch: Partial<InformationSheetRow> = {}): InformationSheetRow {
  return {
    enrollment_id: id,
    matricule: `M-${id}`,
    last_name: last,
    first_name: "Awa",
    genre: "F",
    level_name: "6ème",
    birth_date: null,
    birth_place: null,
    nationality: null,
    assignment_status: null,
    scholarship_kind: null,
    is_repeater: null,
    lv2: null,
    artistic_discipline: null,
    has_photo: false,
    previous_level: null,
    previous_series: null,
    ...patch,
  }
}

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("class=3") }))
vi.mock("@/lib/hooks/useClassChoice", () => ({
  useClassChoice: () => ({
    classes: [{ id: 3, name: "6ème 1", level_id: 1, series_id: null, room_id: null }],
    classId: 3,
    setClassId: vi.fn(),
    isLoading: false,
    isError: false,
  }),
}))
vi.mock("@/lib/hooks/useInformationSheet", () => ({
  useClassInformationSheet: () => ({
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    data: {
      academic_year: { id: 1, name: "2026-2027" },
      classes: [
        {
          id: 3,
          name: "6ème 1",
          level_name: "6ème",
          rows: [row(1, "BAMBA"), row(2, "KONÉ", { previous_level: "CM2" }), row(3, "OUATTARA")],
        },
      ],
    },
  }),
}))
vi.mock("@/lib/hooks/useEnrollmentProfile", () => ({
  useBatchUpdateEnrollmentProfiles: () => ({
    mutate: envoyer,
    isPending: false,
    error: etat.error,
    reset: vi.fn(),
  }),
}))

import { ApiError } from "@/lib/api/client"
import { ProfileBatchError } from "@/lib/api/enrollment-profile"
import { ProfileBatchClient } from "./ProfileBatchClient"

/** Le premier groupe « Qualité » de l'élève : le tableau (les cartes en ont un aussi). */
function qualite(name: string) {
  return screen.getAllByRole("group", { name: `Qualité de ${name}` })[0]
}

describe("la saisie des renseignements par classe", () => {
  it("n'envoie que l'élève modifié, avec le seul champ changé", () => {
    render(<ProfileBatchClient />)
    const save = screen.getByRole("button", { name: /Enregistrer/ })
    expect(save).toBeDisabled()

    fireEvent.click(within(qualite("KONÉ Awa")).getByRole("button", { name: "Redoublant" }))
    expect(screen.getByText("1 élève modifié")).toBeInTheDocument()

    fireEvent.click(save)
    expect(envoyer).toHaveBeenCalledOnce()
    expect(envoyer.mock.calls[0][0]).toEqual([{ enrollment_id: 2, is_repeater: true }])
  })

  it("n'envoie rien pour une ligne remise à sa valeur d'origine", () => {
    envoyer.mockClear()
    render(<ProfileBatchClient />)
    const groupe = qualite("BAMBA Awa")
    fireEvent.click(within(groupe).getByRole("button", { name: "Non redoublant" }))
    fireEvent.click(within(groupe).getByRole("button", { name: "Non renseigné" }))
    expect(screen.getByText("Aucune modification")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Enregistrer/ })).toBeDisabled()
  })

  it("ferme la LV2 de toute la classe en 6ème", () => {
    render(<ProfileBatchClient />)
    expect(screen.getAllByRole("combobox", { name: "LV2 de KONÉ Awa" })[0]).toBeDisabled()
  })

  it("surligne l'élève que le serveur a refusé, nommé et non numéroté", () => {
    etat.error = new ProfileBatchError(
      new ApiError("Inscription 2 : valeur refusée", 422, "x"),
      0,
      [{ enrollment_id: 2, is_repeater: true }],
    )
    render(<ProfileBatchClient />)
    const refus = screen.getAllByText("Refusé : à corriger")
    // Une fois dans le tableau, une fois dans les cartes : la même ligne.
    expect(refus.length).toBeGreaterThan(0)
    const ligne = refus[0].closest("tr") as HTMLElement
    expect(within(ligne).getByText("KONÉ Awa")).toBeInTheDocument()
    expect(ligne).toHaveAttribute("aria-invalid", "true")
    etat.error = null
  })
})

