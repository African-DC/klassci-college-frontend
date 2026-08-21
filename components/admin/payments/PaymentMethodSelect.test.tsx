import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PaymentMethodSelect } from "@/components/admin/payments/PaymentMethodSelect"

const myMethods = vi.fn()

vi.mock("@/lib/api/payments", () => ({
  paymentsApi: {
    myMethods: () => myMethods(),
  },
}))

function renderSelect(value: string, onChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <PaymentMethodSelect value={value} onChange={onChange} />
    </QueryClientProvider>,
  )
  return onChange
}

/** Radix ne monte les options qu'à l'ouverture : on lit la liste du serveur. */
const TOUS_LES_MOYENS = [
  { key: "cash", label: "Espèces" },
  { key: "wave", label: "Wave" },
  { key: "mtn_momo", label: "MTN MoMo" },
  { key: "orange_money", label: "Orange Money" },
  { key: "moov_money", label: "Moov Money" },
  { key: "bank_transfer", label: "Virement bancaire" },
  { key: "cheque", label: "Chèque" },
]

const SANS_ESPECES = TOUS_LES_MOYENS.filter((m) => m.key !== "cash")

describe("Sélecteur du moyen d'encaissement", () => {
  beforeEach(() => {
    myMethods.mockReset()
  })

  it("n'affiche que les moyens que le serveur autorise", async () => {
    myMethods.mockResolvedValue(SANS_ESPECES)
    renderSelect("wave")

    // Le déclencheur montre le moyen retenu, jamais un moyen refusé.
    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveTextContent("Wave")
    })
    expect(screen.queryByText("Espèces")).not.toBeInTheDocument()
  })

  it("bascule sur un moyen autorisé quand la valeur par défaut ne l'est pas", async () => {
    myMethods.mockResolvedValue(SANS_ESPECES)
    // Le formulaire s'ouvre sur « cash » par défaut ; le comptable ne l'a pas.
    const onChange = renderSelect("cash")

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("wave")
    })
    // Et il n'envoie surtout pas « cash » en attendant.
    expect(screen.getByRole("combobox")).not.toHaveTextContent("Espèces")
  })

  it("laisse la valeur en place quand elle est autorisée", async () => {
    myMethods.mockResolvedValue(TOUS_LES_MOYENS)
    const onChange = renderSelect("cash")

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveTextContent("Espèces")
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("ne propose jamais la valeur historique Mobile Money", async () => {
    myMethods.mockResolvedValue(TOUS_LES_MOYENS)
    renderSelect("cash")

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveTextContent("Espèces")
    })
    expect(screen.queryByText("Mobile Money")).not.toBeInTheDocument()
  })

  it("explique la situation quand aucun moyen n'est autorisé", async () => {
    myMethods.mockResolvedValue([])
    renderSelect("cash")

    // Pas un sélecteur vide : un message qui dit quoi faire.
    expect(
      await screen.findByText(/Aucun moyen de paiement ne vous est autorisé/),
    ).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("prévient au lieu de rester muet quand le chargement échoue", async () => {
    myMethods.mockRejectedValue(new Error("réseau"))
    renderSelect("cash")

    expect(
      await screen.findByText(/Impossible de charger les moyens de paiement/),
    ).toBeInTheDocument()
  })
})
