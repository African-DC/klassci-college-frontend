import { fireEvent, render, screen, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vitest"

const slots = [{
  id: 17,
  class_id: 5,
  class_name: "6e A",
  teacher_id: 7,
  teacher_name: "NANA JACQUES",
  subject_id: 3,
  subject_name: "SVT",
  academic_year_id: 2,
  day: "vendredi",
  start_time: "08:00",
  end_time: "09:50",
  room: "Salle 6e A",
  subject_color: "cyan",
}]

vi.mock("@/lib/hooks/useTimetable", () => ({
  useTimetable: () => ({ data: slots, isLoading: false }),
  useDeleteSlot: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("@/components/forms/TimetableSlotForm", () => ({
  TimetableSlotForm: ({ slot, defaultDay, onSuccess }: {
    slot?: { id: number }
    defaultDay?: string
    onSuccess: () => void
  }) => (
    <div>
      <p>{slot ? `Formulaire de modification #${slot.id}` : `Formulaire d'ajout ${defaultDay}`}</p>
      <button type="button" onClick={onSuccess}>Enregistrer le créneau test</button>
    </div>
  ),
}))

import { TimetableGrid } from "./TimetableGrid"

function afficherGrille() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TimetableGrid classId={5} />
    </QueryClientProvider>,
  )
}

describe("emploi du temps sur un petit écran", () => {
  it("permet l'ajout directement depuis l'onglet de jour sans écran bloquant", () => {
    afficherGrille()
    const friday = screen.getByRole("tab", { name: "Ven" })
    fireEvent.keyDown(friday, { key: "Enter", code: "Enter" })
    expect(friday).toHaveAttribute("data-state", "active")
    fireEvent.click(screen.getByRole("button", { name: "Ajouter un créneau" }))
    expect(screen.getByRole("dialog", { name: "Ajouter un créneau" })).toBeInTheDocument()
    expect(screen.getByText("Formulaire d'ajout vendredi")).toBeInTheDocument()
    expect(screen.queryByText(/écran trop petit/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le créneau test" }))
    expect(screen.queryByRole("dialog", { name: "Ajouter un créneau" })).not.toBeInTheDocument()
  })

  it("permet de modifier un créneau depuis la carte mobile", () => {
    afficherGrille()
    const friday = screen.getByRole("tab", { name: "Ven" })
    fireEvent.keyDown(friday, { key: "Enter", code: "Enter" })
    expect(friday).toHaveAttribute("data-state", "active")
    const mobileDay = screen.getByRole("tabpanel", { name: "Ven" })
    fireEvent.click(within(mobileDay).getByRole("button", { name: /SVT/ }))
    expect(screen.getByRole("dialog", { name: "SVT" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }))
    expect(screen.getByRole("dialog", { name: "Modifier le créneau" })).toBeInTheDocument()
    expect(screen.getByText("Formulaire de modification #17")).toBeInTheDocument()
  })
})
