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
function renderField(
  value: boolean | null | undefined,
  studentId: number | null = 7,
  error?: string,
) {
  const onChange = vi.fn()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const champ = (props: { studentId: number | null; value: boolean | null | undefined }) => (
    <QueryClientProvider client={client}>
      <NewStudentField
        studentId={props.studentId ?? undefined}
        academicYearId={3}
        value={props.value}
        error={error}
        onChange={onChange}
      />
    </QueryClientProvider>
  )
  const { rerender } = render(champ({ studentId, value }))
  return {
    onChange,
    rejouer: (props: { studentId: number | null; value: boolean | null | undefined }) =>
      rerender(champ(props)),
  }
}

function choix(nom: RegExp) {
  return screen.getByRole("button", { name: nom })
}

describe("Le profil « nouvel élève »", () => {
  beforeEach(() => {
    getNewStudentSuggestion.mockReset()
  })

  it("se coche quand le serveur suggère « nouveau », et dit pourquoi", async () => {
    getNewStudentSuggestion.mockResolvedValue({
      suggested: true,
      reason: "Aucune inscription antérieure pour cet élève.",
    })
    const { onChange } = renderField(null)

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(true))
    expect(screen.getByText(/Aucune inscription antérieure pour cet élève/)).toBeInTheDocument()
  })

  it("se décoche quand le serveur suggère « ancien »", async () => {
    getNewStudentSuggestion.mockResolvedValue({
      suggested: false,
      reason: "Cet élève était inscrit en 2024-2025.",
    })
    const { onChange } = renderField(null)

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
    const { onChange } = renderField(null)

    await waitFor(() =>
      expect(screen.getByText(/Aucune année antérieure n'est enregistrée/)).toBeInTheDocument(),
    )
    expect(onChange).not.toHaveBeenCalledWith(false)
    expect(onChange).not.toHaveBeenCalledWith(true)
    expect(screen.getByText(/C'est à vous de trancher/)).toBeInTheDocument()
  })

  /**
   * Une réponse « je ne peux pas trancher » a l'air prudente, mais elle se coche
   * en une seconde et facture de travers en silence. La question doit être posée
   * jusqu'à ce qu'elle reçoive une réponse.
   */
  it("n'offre aucune façon d'esquiver la question", async () => {
    getNewStudentSuggestion.mockResolvedValue({ suggested: null, reason: "Rien en base." })
    renderField(null)

    expect(await screen.findByRole("button", { name: /Nouvel élève/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Déjà inscrit ici avant/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /trancher/i })).not.toBeInTheDocument()
  })

  it("dit pourquoi la question est posée, et ce qu'elle coûte sans réponse", async () => {
    getNewStudentSuggestion.mockResolvedValue({ suggested: null, reason: "Rien en base." })
    renderField(null)

    expect(await screen.findByText(/aucun de ces frais n'est facturé/)).toBeInTheDocument()
    expect(screen.getByText(/certains frais ne sont dus que par les nouveaux élèves/)).toBeInTheDocument()
  })

  it("affiche le message de validation quand on a tenté de continuer sans répondre", async () => {
    getNewStudentSuggestion.mockResolvedValue({ suggested: null, reason: "Rien en base." })
    renderField(null, 7, "Indiquez si l'élève arrive cette année.")

    expect(await screen.findByRole("alert")).toHaveTextContent(/Indiquez si l'élève arrive/)
  })

  it("laisse la secrétaire contredire la suggestion", async () => {
    getNewStudentSuggestion.mockResolvedValue({ suggested: true, reason: "Rien en base." })
    const { onChange } = renderField(true)

    await waitFor(() => expect(getNewStudentSuggestion).toHaveBeenCalled())
    fireEvent.click(choix(/Déjà inscrit ici avant/))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  /**
   * Changer d'élève dans le formulaire ne doit pas garder le profil du
   * précédent : ce sont les frais d'un autre dossier qui partiraient.
   */
  it("remet le profil à zéro quand on change d'élève", async () => {
    getNewStudentSuggestion.mockResolvedValue({ suggested: true, reason: "Rien en base." })
    const { onChange, rejouer } = renderField(true)

    await waitFor(() => expect(getNewStudentSuggestion).toHaveBeenCalled())
    onChange.mockClear()

    rejouer({ studentId: 8, value: true })

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(null))
  })

  it("ne coche rien pour un élève qui n'existe pas encore en base", async () => {
    const { onChange } = renderField(null, null)

    // Créer la fiche d'un élève ne prouve pas qu'il arrive cette année : une
    // école qui rattrape son fichier saisit aussi des élèves présents depuis
    // trois ans. L'écran le dit et ne coche rien à sa place.
    expect(screen.getByText(/n'existe pas encore en base/)).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })
})
