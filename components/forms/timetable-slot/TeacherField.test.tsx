import { fireEvent, render, screen } from "@testing-library/react"
import { useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import type { TimetableSlotCreate } from "@/lib/contracts/timetable"
import type { ClassSubjectTeacherItem } from "@/lib/contracts/class-subject-teachers"
import type { Subject } from "@/lib/contracts/subject"
import { Form } from "@/components/ui/form"
import { pickSelectOption } from "@/tests/radix-select"
import { SubjectField } from "./SubjectField"
import { TeacherField, type TeacherFieldStatus } from "./TeacherField"

const ITEMS: ClassSubjectTeacherItem[] = [
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
]

const SUBJECTS = [
  { id: 1, name: "Mathématiques", coefficient: 3, hours_per_week: 4 },
  { id: 3, name: "Anglais", coefficient: 2, hours_per_week: 2 },
] as unknown as Subject[]

interface HarnessProps {
  subjectId?: number
  teacherId?: number
  status?: TeacherFieldStatus
  currentTeacher?: { id: number; name: string }
  onRetry?: () => void
}

function Harness({
  subjectId = 1,
  teacherId = 6,
  status = "ready",
  currentTeacher,
  onRetry = () => {},
}: HarnessProps) {
  const form = useForm<TimetableSlotCreate>({
    defaultValues: {
      day: "lundi",
      start_time: "08:00",
      end_time: "09:00",
      class_id: 5,
      academic_year_id: 1,
      room: "",
      subject_id: subjectId,
      teacher_id: teacherId,
    } as TimetableSlotCreate,
  })
  return (
    <Form {...form}>
      <SubjectField
        form={form}
        subjects={SUBJECTS}
        items={status === "ready" ? ITEMS : undefined}
        onCreateSubject={() => {}}
      />
      <TeacherField
        form={form}
        items={status === "ready" ? ITEMS : undefined}
        status={status}
        currentTeacher={currentTeacher}
        onRetry={onRetry}
        onCreateTeacher={() => {}}
      />
    </Form>
  )
}

describe("Matière et enseignant du créneau", () => {
  it("choisir une matière prend l'enseignant qu'elle a retenu", () => {
    render(<Harness subjectId={undefined} teacherId={undefined} />)

    pickSelectOption(screen.getByRole("combobox", { name: /Matière/ }), "Anglais (Coef. 2, 2h/sem)")
    expect(screen.getByRole("combobox", { name: /Enseignant/ })).toHaveTextContent("Koffi Traoré")

    pickSelectOption(screen.getByRole("combobox", { name: /Matière/ }), "Mathématiques (Coef. 3, 4h/sem)")
    expect(screen.getByRole("combobox", { name: /Enseignant/ })).toHaveTextContent("Yao Bamba")
  })

  it("en modification, garde l'enseignant existant au montage", () => {
    render(<Harness subjectId={1} teacherId={7} />)

    expect(screen.getByRole("combobox", { name: /Enseignant/ })).toHaveTextContent("Aïssatou Diallo")
  })

  it("affiche l'enseignant du créneau même s'il n'est plus retenu, avec un avertissement", () => {
    render(
      <Harness subjectId={1} teacherId={99} currentTeacher={{ id: 99, name: "Marc Ouattara" }} />,
    )

    expect(screen.getByRole("combobox", { name: /Enseignant/ })).toHaveTextContent(
      "Marc Ouattara (non retenu pour cette matière)",
    )
    expect(
      screen.getByText(/assigné à un enseignant non retenu pour cette matière/),
    ).toBeInTheDocument()
  })

  it("affiche une erreur avec Réessayer quand les enseignants de la classe ne chargent pas", () => {
    const onRetry = vi.fn()
    render(<Harness status="error" onRetry={onRetry} />)

    expect(screen.getByText("Impossible de charger les enseignants de la classe.")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
