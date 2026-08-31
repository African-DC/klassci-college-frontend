import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RegenerateFeesAction } from "@/components/shared/fees/RegenerateFeesAction"

const regenerateFees = vi.fn()

vi.mock("@/lib/api/enrollments", () => ({
  enrollmentsApi: {
    regenerateFees: (id: number) => regenerateFees(id),
  },
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderAction() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RegenerateFeesAction
        enrollmentIds={[12]}
        subject="Kouadio Awa, pour cette inscription"
        feesWithPayments={2}
        feesWithoutPayments={3}
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
