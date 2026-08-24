import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { EntitlementsList, EntitlementsPopover } from "./FeeEntitlements"
import type { FeeEntitlement } from "@/lib/contracts/fee"

/**
 * Ce que voit la famille quand elle demande « on a payé quoi, exactement ».
 *
 * Les cas couverts sont ceux qui se produisent vraiment : une école qui n'a
 * encore rien décrit, une école restée en texte libre, et le frontend déployé
 * avant le backend qui renvoie ce champ.
 */

const TENUE: FeeEntitlement[] = [
  { label: "tenue de sport", quantity: 1, kind: "item" },
  { label: "macarons", quantity: 2, kind: "item" },
  { label: "infirmerie", quantity: null, kind: "access" },
]

describe("EntitlementsList", () => {
  it("sépare ce qui se retire de ce qui s'ouvre", () => {
    render(<EntitlementsList entitlements={TENUE} />)

    expect(screen.getByText("À retirer")).toBeInTheDocument()
    expect(screen.getByText("Accès ouverts")).toBeInTheDocument()
    expect(screen.getByText("1 tenue de sport")).toBeInTheDocument()
    expect(screen.getByText("2 macarons")).toBeInTheDocument()
  })

  it("n'annonce pas de quantité sur un accès", () => {
    render(<EntitlementsList entitlements={TENUE} />)

    expect(screen.getByText("infirmerie")).toBeInTheDocument()
    expect(screen.queryByText("1 infirmerie")).not.toBeInTheDocument()
  })

  it("n'affiche pas la rubrique « à retirer » quand rien ne se retire", () => {
    render(<EntitlementsList entitlements={[{ label: "bibliothèque", kind: "access" }]} />)

    expect(screen.queryByText("À retirer")).not.toBeInTheDocument()
    expect(screen.getByText("Accès ouverts")).toBeInTheDocument()
  })

  it("retombe sur la note libre tant que rien n'est saisi", () => {
    render(<EntitlementsList entitlements={[]} fallbackNote="Donne droit à une tenue de sport." />)

    expect(screen.getByText("Donne droit à une tenue de sport.")).toBeInTheDocument()
  })

  it("le dit clairement quand aucune contrepartie n'existe", () => {
    render(<EntitlementsList entitlements={[]} />)

    expect(screen.getByText(/Aucune contrepartie/)).toBeInTheDocument()
  })

  it("survit à un backend qui ne renvoie pas encore le champ", () => {
    render(<EntitlementsList entitlements={undefined} fallbackNote="Note de l'école." />)

    expect(screen.getByText("Note de l'école.")).toBeInTheDocument()
  })
})

describe("EntitlementsPopover", () => {
  it("ne propose rien quand le frais ne promet rien", () => {
    const { container } = render(
      <EntitlementsPopover categoryName="Inscription" entitlements={[]} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("reste muet quand le backend ne renvoie pas encore le champ", () => {
    const { container } = render(
      <EntitlementsPopover categoryName="Inscription" entitlements={undefined} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("s'ouvre dès qu'une note libre existe, sans élément saisi", () => {
    render(
      <EntitlementsPopover categoryName="COGES" entitlements={[]} fallbackNote="Entretien." />,
    )

    expect(screen.getByRole("button", { name: /Ce que couvre COGES/ })).toBeInTheDocument()
  })

  it("nomme la catégorie dans son libellé accessible", () => {
    render(<EntitlementsPopover categoryName="Tenue" entitlements={TENUE} />)

    expect(screen.getByRole("button", { name: "Ce que couvre Tenue" })).toBeInTheDocument()
  })
})
