import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ClassSubjectTeachers } from "@/lib/contracts/class-subject-teachers"
import { ClassSubjectTeachersPanel } from "./ClassSubjectTeachersPanel"
import { pickSelectOption } from "@/tests/radix-select"

const getMock = vi.fn()
const saveMock = vi.fn()

vi.mock("@/lib/api/class-subject-teachers", () => ({
  classSubjectTeachersApi: {
    get: (...args: unknown[]) => getMock(...args),
    save: (...args: unknown[]) => saveMock(...args),
  },
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const DONNEES: ClassSubjectTeachers = {
  class_id: 5,
  class_name: "6e A",
  missing_count: 2,
  items: [
    {
      subject_id: 1,
      subject_name: "Mathématiques",
      hours_per_week: 4,
      series_name: null,
      eligible_teachers: [{ id: 7, full_name: "Aïssatou Diallo" }],
      assigned_teacher_id: null,
      resolved_teacher_id: 7,
      source: "single",
    },
    {
      subject_id: 2,
      subject_name: "Physique",
      hours_per_week: 3,
      series_name: "C",
      eligible_teachers: [],
      assigned_teacher_id: null,
      resolved_teacher_id: null,
      source: "none",
    },
    {
      subject_id: 3,
      subject_name: "Anglais",
      hours_per_week: 2,
      series_name: null,
      eligible_teachers: [
        { id: 8, full_name: "Koffi Traoré" },
        { id: 9, full_name: "Awa Kouamé" },
      ],
      assigned_teacher_id: null,
      resolved_teacher_id: null,
      source: "none",
    },
  ],
}

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ClassSubjectTeachersPanel classId={5} />
    </QueryClientProvider>,
  )
}

describe("Panneau « Enseignants de la classe »", () => {
  beforeEach(() => {
    getMock.mockReset()
    saveMock.mockReset()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it("pré-sélectionne l'unique enseignant possible et l'indique", async () => {
    getMock.mockResolvedValue(DONNEES)
    renderPanel()

    const select = await screen.findByRole("combobox", { name: "Enseignant de Mathématiques" })
    await waitFor(() => expect(select).toHaveTextContent("Aïssatou Diallo"))
    expect(screen.getByText("Seul enseignant retenu pour ce niveau")).toBeInTheDocument()
  })

  it("marque « À compléter » les matières sans enseignant et annonce le compte", async () => {
    getMock.mockResolvedValue(DONNEES)
    renderPanel()

    await screen.findByText("2 matières à compléter")
    expect(screen.getAllByText("À compléter")).toHaveLength(2)
    expect(screen.getByText("Prêt")).toBeInTheDocument()
  })

  it("envoie seulement les lignes modifiées et confirme l'enregistrement", async () => {
    getMock.mockResolvedValue(DONNEES)
    saveMock.mockResolvedValue(DONNEES)
    renderPanel()

    const enregistrer = await screen.findByRole("button", { name: "Enregistrer" })
    await waitFor(() => expect(enregistrer).toBeEnabled())
    fireEvent.click(enregistrer)

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(5, [{ subject_id: 1, teacher_id: 7 }])
    })
    expect(toast.success).toHaveBeenCalledWith("Enseignants de la classe enregistrés")
  })

  it("envoie le choix fait à la main pour une matière à plusieurs enseignants", async () => {
    getMock.mockResolvedValue(DONNEES)
    saveMock.mockResolvedValue(DONNEES)
    renderPanel()

    const trigger = await screen.findByRole("combobox", { name: "Enseignant de Anglais" })
    pickSelectOption(trigger, "Awa Kouamé")
    await waitFor(() => expect(trigger).toHaveTextContent("Awa Kouamé"))

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }))
    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(5, [
        { subject_id: 1, teacher_id: 7 },
        { subject_id: 3, teacher_id: 9 },
      ])
    })
  })

  it("affiche le détail refusé par le backend dans une alerte", async () => {
    getMock.mockResolvedValue(DONNEES)
    saveMock.mockRejectedValue(
      Object.assign(new Error("HTTP 422"), { detail: "Enseignant non retenu pour cette matière" }),
    )
    renderPanel()

    fireEvent.click(await screen.findByRole("button", { name: "Enregistrer" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Enregistrement impossible", {
        description: "Enseignant non retenu pour cette matière",
      })
    })
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("affiche l'état vide quand le niveau n'a aucune matière", async () => {
    getMock.mockResolvedValue({ ...DONNEES, items: [], missing_count: 0 })
    renderPanel()

    expect(
      await screen.findByText("Aucune matière n'est définie pour le niveau de cette classe."),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Gérer les matières" })).toHaveAttribute(
      "href",
      "/admin/subjects",
    )
  })
})
