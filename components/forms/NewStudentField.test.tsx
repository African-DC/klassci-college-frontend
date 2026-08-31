import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NewStudentField } from "@/components/forms/NewStudentField"

const getNewStudentSuggestion = vi.fn()

vi.mock("@/lib/api/students", () => ({
  studentsApi: {
    getNewStudentSuggestion: (studentId: number, yearId: number) =>
      getNewStudentSuggestion(studentId, yearId),
  },
}))

/** `studentId: null` = l'élève est créé par le formulaire, il n'a pas encore d'identifiant. */
function renderField(value: boolean | null | undefined, studentId: number | null = 7) {
  const onChange = vi.fn()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const { rerender } = render(
    <QueryClientProvider client={client}>
      <NewStudentField
        studentId={studentId ?? undefined}
        academicYearId={3}
        value={value}
        onChange={onChange}
      />
    </QueryClientProvider>,
  )
  return { onChange, rerender }
}

function choix(nom: RegExp) {
  return screen.getByRole("button", { name: nom })
}

describe("La case « nouvel élève »", () => {
  beforeEach(() => {
    getNewStudentSuggestion.mockReset()
  })

  it("se coche quand le serveur suggère « nouveau », et dit pourquoi", async () => {
    getNewStudentSuggestion.mockResolvedValue({
      suggested: true,
      reason: "Aucune inscription antérieure pour cet élève.",
    })
    const { onChange } = renderField(undefined)

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(true))
    expect(screen.getByText(/Aucune inscription antérieure pour cet élève/)).toBeInTheDocument()
  })

  it("se décoche quand le serveur suggère « ancien »", async () => {
    getNewStudentSuggestion.mockResolvedValue({
      suggested: false,
      reason: "Cet élève était inscrit en 2024-2025.",
    })
    const { onChange } = renderField(undefined)

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(false))
  })

  /**
   * Le cœur du sujet. Un établissement dont l'année précédente n'est pas
   * reconstituée n'a aucune inscription antérieure à montrer : en déduire
   * « nouveau » facturerait la chemise cartonnée à tous ses anciens élèves.
   */
  it("n'affirme rien quand le serveur ne peut rien affirmer", async () => {
    getNewStudentSuggestion.mockResolvedValue({
      suggested: null,
      reason: "Aucune année antérieure n'est enregistrée dans l'établissement.",
    })
    const { onChange } = renderField(undefined)

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(null))
    expect(onChange).not.toHaveBeenCalledWith(false)
    expect(onChange).not.toHaveBeenCalledWith(true)
    expect(
      await screen.findByText(/Aucune année antérieure n'est enregistrée/),
    ).toBeInTheDocument()
    expect(screen.getByText(/C'est à vous de trancher/)).toBeInTheDocument()
  })

  it("laisse la secrétaire contredire la suggestion", async () => {
    getNewStudentSuggestion.mockResolvedValue({ suggested: true, reason: "Rien en base." })
    const { onChange } = renderField(true)

    await waitFor(() => expect(getNewStudentSuggestion).toHaveBeenCalled())
    fireEvent.click(choix(/Non, il était déjà là/))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it("prévient que le choix change la facture", async () => {
    getNewStudentSuggestion.mockResolvedValue({ suggested: null, reason: "Rien en base." })
    renderField(null)

    expect(
      await screen.findByText(/aucun de ces frais n'est facturé/),
    ).toBeInTheDocument()
  })

  it("ne coche rien pour un élève qui n'existe pas encore en base", async () => {
    const { onChange } = renderField(undefined, null)

    // Créer la fiche d'un élève ne prouve pas qu'il arrive cette année : une
    // école qui rattrape son fichier saisit aussi des élèves présents depuis
    // trois ans. L'écran le dit et ne coche rien à sa place.
    expect(screen.getByText(/n'existe pas encore en base/)).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })
})
