import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RegenerateFeesAction } from "@/components/shared/fees/RegenerateFeesAction"
import type { FeeLineCounts } from "@/lib/enrollment/fee-lines"

const regenerateFees = vi.fn()

vi.mock("@/lib/api/enrollments", () => ({
  enrollmentsApi: {
    regenerateFees: (id: number) => regenerateFees(id),
  },
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

/** `null` = l'écran ne connaît pas encore ses lignes. */
function renderAction(feeLines: FeeLineCounts | null = {
  withPayments: 2,
  withoutPayments: 3,
  settledWithoutCash: 1,
}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RegenerateFeesAction
        enrollmentIds={[12]}
        subject="Kouadio Awa, pour cette inscription"
        feeLines={feeLines ?? undefined}
      />
    </QueryClientProvider>,
  )
}

describe("Régénérer les frais", () => {
  beforeEach(() => {
    regenerateFees.mockReset()
    regenerateFees.mockResolvedValue({ message: "3 lignes remplacées, 2 conservées." })
  })

  it("ne régénère rien avant confirmation", () => {
    renderAction()

    fireEvent.click(screen.getByRole("button", { name: /Régénérer les frais/ }))

    expect(regenerateFees).not.toHaveBeenCalled()
  })

  it("annonce ce qui va arriver, pas « êtes-vous sûr »", () => {
    renderAction()
    fireEvent.click(screen.getByRole("button", { name: /Régénérer les frais/ }))

    const dialog = screen.getByRole("alertdialog")
    expect(dialog).toHaveTextContent(/aucun versement n'a été imputé sont remplacées/)
    expect(dialog).toHaveTextContent(/portent déjà un versement sont conservées/)
    expect(dialog).toHaveTextContent(/3 lignes.*sans versement/)
    expect(dialog).toHaveTextContent(/2 lignes.*avec un versement/)
    expect(dialog).not.toHaveTextContent(/Êtes-vous sûr/i)
  })

  /**
   * Une ligne exonérée ou déposée en nature est soldée sans versement : la
   * compter parmi « les lignes sans versement » promettrait de la remplacer.
   */
  it("range les lignes exonérées à part, hors des deux décomptes", () => {
    renderAction()
    fireEvent.click(screen.getByRole("button", { name: /Régénérer les frais/ }))

    const dialog = screen.getByRole("alertdialog")
    expect(dialog).toHaveTextContent(/1 ligne exonérée ou déposée en nature/)
  })

  /**
   * Un décompte non chargé vaut zéro en mémoire, et « 0 ligne » s'affirme.
   */
  it("ne chiffre rien tant que les lignes ne sont pas chargées", () => {
    renderAction(null)
    fireEvent.click(screen.getByRole("button", { name: /Régénérer les frais/ }))

    const dialog = screen.getByRole("alertdialog")
    expect(dialog).toHaveTextContent(/pas encore chargées/)
    expect(dialog).not.toHaveTextContent(/0 ligne/)
  })

  it("régénère une fois la confirmation donnée", async () => {
    renderAction()
    fireEvent.click(screen.getByRole("button", { name: /Régénérer les frais/ }))

    const dialog = screen.getByRole("alertdialog")
    fireEvent.click(
      screen.getAllByRole("button", { name: /Régénérer les frais/ }).find((b) => dialog.contains(b))!,
    )

    await waitFor(() => expect(regenerateFees).toHaveBeenCalledWith(12))
  })
})
