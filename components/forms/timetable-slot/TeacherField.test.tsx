import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { TimetableSlotCreate } from "@/lib/contracts/timetable"
import type { ClassSubjectTeachers } from "@/lib/contracts/class-subject-teachers"
import { Form } from "@/components/ui/form"
import { TeacherField } from "./TeacherField"

const getMock = vi.fn()

vi.mock("@/lib/api/class-subject-teachers", () => ({
  classSubjectTeachersApi: {
    get: (...args: unknown[]) => getMock(...args),
    save: vi.fn(),
  },
}))

const DONNEES: ClassSubjectTeachers = {
  class_id: 5,
  class_name: "6e A",
  missing_count: 1,
  items: [
    {
      subject_id: 1,
      subject_name: "Mathématiques",
      hours_per_week: 4,
      series_name: null,
      eligible_teachers: [
        { id: 7, full_name: "Aïssatou Diallo" },
        { id: 6, full_name: "Yao Bamba" },
      ],
      assigned_teacher_id: 6,
      resolved_teacher_id: 6,
      source: "explicit",
    },
    {
      subject_id: 3,
      subject_name: "Anglais",
      hours_per_week: 2,
      series_name: null,
      eligible_teachers: [{ id: 8, full_name: "Koffi Traoré" }],
      assigned_teacher_id: null,
      resolved_teacher_id: 8,
      source: "single",
    },
    {
      subject_id: 2,
      subject_name: "Physique",
      hours_per_week: 3,
      series_name: null,
      eligible_teachers: [],
      assigned_teacher_id: null,
      resolved_teacher_id: null,
      source: "none",
    },
  ],
}

function Harness() {
  const form = useForm<TimetableSlotCreate>({
    defaultValues: {
      day: "lundi",
      start_time: "08:00",
      end_time: "09:00",
      class_id: 5,
      academic_year_id: 1,
      room: "",
    } as TimetableSlotCreate,
  })
  return (
    <Form {...form}>
      <button type="button" onClick={() => form.setValue("subject_id", 1, { shouldDirty: true })}>
        Choisir Mathématiques
      </button>
      <button type="button" onClick={() => form.setValue("subject_id", 3, { shouldDirty: true })}>
        Choisir Anglais
      </button>
      <button type="button" onClick={() => form.setValue("subject_id", 2, { shouldDirty: true })}>
        Choisir Physique
      </button>
      <TeacherField form={form} classId={5} onCreateTeacher={() => {}} />
    </Form>
  )
}

function renderField() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  )
}

describe("Champ enseignant du créneau", () => {
  beforeEach(() => {
    getMock.mockReset()
    getMock.mockResolvedValue(DONNEES)
  })

  it("prend l'enseignant retenu de la matière choisie à chaque changement", async () => {
    renderField()

    fireEvent.click(screen.getByRole("button", { name: "Choisir Mathématiques" }))
    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveTextContent("Yao Bamba")
    })

    fireEvent.click(screen.getByRole("button", { name: "Choisir Anglais" }))
    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveTextContent("Koffi Traoré")
    })
  })

  it("explique qu'aucun enseignant n'est retenu pour une matière sans choix", async () => {
    renderField()

    fireEvent.click(screen.getByRole("button", { name: "Choisir Physique" }))
    expect(
      await screen.findByText(/Aucun enseignant retenu pour cette matière dans cette classe/),
    ).toBeInTheDocument()
  })
})
