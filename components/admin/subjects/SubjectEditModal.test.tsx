import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { toast } from "sonner"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  getSubjectSlotCounts: vi.fn(),
  subjectState: { data: null as unknown, isLoading: false },
}))

vi.mock("@/lib/api/subjects", () => ({
  subjectsApi: {},
  duplicateSubject: vi.fn(),
  getSubjectSlotCounts: mocks.getSubjectSlotCounts,
}))

const SUBJECT = {
  id: 5,
  name: "Mathématiques",
  level_id: 1,
  level_name: "6ème",
  series_id: null,
  coefficient: 3,
  hours_per_week: 4,
  color: "blue",
  teacher_id: 10,
  teacher_name: "Mariam Koné",
  teachers: [
    { id: 10, full_name: "Mariam Koné" },
    { id: 11, full_name: "Éloïse Martin" },
  ],
}

vi.mock("@/lib/hooks/useSubjects", () => ({
  useSubject: () => mocks.subjectState,
  useUpdateSubject: () => ({ mutate: mocks.mutate, isPending: false, error: null }),
}))

vi.mock("@/lib/hooks/useSeries", () => ({
  useSeriesList: () => ({ data: { items: [] } }),
}))

vi.mock("@/lib/hooks/useTeachers", () => ({
  useTeachers: () => ({
    data: {
      items: [
        { id: 10, first_name: "Mariam", last_name: "Koné", speciality: "Mathématiques" },
        { id: 11, first_name: "Éloïse", last_name: "Martin", speciality: "Français" },
        { id: 12, first_name: "Jean", last_name: "Kouassi", speciality: null },
      ],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { SubjectEditModal } from "./SubjectEditModal"

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>
  proto.scrollIntoView ??= () => {}
  proto.hasPointerCapture ??= () => false
  proto.releasePointerCapture ??= () => {}
})

function modal() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <SubjectEditModal subjectId={5} open onClose={() => {}} />
    </QueryClientProvider>
  )
}

function renderModal() {
  return render(modal())
}

describe("Modifier une matière : enseignants", () => {
  beforeEach(() => {
    mocks.mutate.mockReset()
    mocks.getSubjectSlotCounts.mockReset()
    vi.mocked(toast.error).mockReset()
    mocks.subjectState.data = SUBJECT
    mocks.subjectState.isLoading = false
  })

  it("affiche les enseignants déjà assignés en pastilles à l'ouverture", async () => {
    renderModal()

    expect(await screen.findByRole("button", { name: "Retirer Mariam Koné" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retirer Éloïse Martin" })).toBeInTheDocument()
  })

  it("affiche le squelette tant que la matière charge, puis le formulaire rempli", async () => {
    mocks.subjectState.data = undefined
    mocks.subjectState.isLoading = true
    const { rerender } = renderModal()

    expect(screen.queryByRole("button", { name: "Mettre à jour" })).not.toBeInTheDocument()

    mocks.subjectState.data = SUBJECT
    mocks.subjectState.isLoading = false
    rerender(modal())

    expect(await screen.findByRole("button", { name: "Mettre à jour" })).toBeInTheDocument()
    expect(screen.getByDisplayValue("Mathématiques")).toBeInTheDocument()
  })

  it("enregistre sans demander de confirmation quand aucun enseignant n'est retiré", async () => {
    mocks.subjectState.data = undefined
    mocks.subjectState.isLoading = true
    const { rerender } = renderModal()
    mocks.subjectState.data = SUBJECT
    mocks.subjectState.isLoading = false
    rerender(modal())

    fireEvent.click(await screen.findByRole("button", { name: "Mettre à jour" }))

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledOnce())
    expect(mocks.mutate.mock.calls[0][0]).toMatchObject({ teacher_ids: [10, 11] })
    expect(mocks.getSubjectSlotCounts).not.toHaveBeenCalled()
    expect(screen.queryByText("Retirer des enseignants ?")).not.toBeInTheDocument()
  })

  it("demande confirmation avant de retirer un enseignant qui a des créneaux", async () => {
    mocks.getSubjectSlotCounts.mockResolvedValue({
      counts: [{ teacher_id: 11, slots: 2 }],
    })
    renderModal()

    fireEvent.click(await screen.findByRole("button", { name: "Retirer Éloïse Martin" }))
    fireEvent.click(screen.getByRole("button", { name: "Mettre à jour" }))

    expect(await screen.findByText("Retirer des enseignants ?")).toBeInTheDocument()
    expect(screen.getByText(/déjà 2 créneaux/)).toBeInTheDocument()
    expect(mocks.getSubjectSlotCounts).toHaveBeenCalledWith(5)
    expect(mocks.mutate).not.toHaveBeenCalled()
  })

  it("enregistre directement quand le retrait ne touche aucun créneau", async () => {
    mocks.getSubjectSlotCounts.mockResolvedValue({ counts: [] })
    renderModal()

    fireEvent.click(await screen.findByRole("button", { name: "Retirer Éloïse Martin" }))
    fireEvent.click(screen.getByRole("button", { name: "Mettre à jour" }))

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledOnce())
    expect(mocks.mutate.mock.calls[0][0]).toMatchObject({ teacher_ids: [10] })
    expect(screen.queryByText("Retirer des enseignants ?")).not.toBeInTheDocument()
  })

  it("affiche une erreur et n'enregistre pas si la vérification des créneaux échoue", async () => {
    mocks.getSubjectSlotCounts.mockRejectedValue(new Error("réseau"))
    renderModal()

    fireEvent.click(await screen.findByRole("button", { name: "Retirer Éloïse Martin" }))
    fireEvent.click(screen.getByRole("button", { name: "Mettre à jour" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Impossible de vérifier l’emploi du temps. Réessayez."))
    expect(mocks.mutate).not.toHaveBeenCalled()
    expect(screen.queryByText("Retirer des enseignants ?")).not.toBeInTheDocument()
  })
})
