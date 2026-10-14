/** La disponibilité de la LV2 dépend de la configuration du niveau du tenant. */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EMPTY_PROFILE } from "@/lib/contracts/enrollment-profile"
import { EnrollmentProfileFields } from "./EnrollmentProfileFields"

function renderFor(lv2Enabled: boolean, onChange = vi.fn()) {
  render(
    <EnrollmentProfileFields
      idPrefix="t"
      value={{ ...EMPTY_PROFILE, lv2: "allemand" }}
      onChange={onChange}
      lv2Enabled={lv2Enabled}
    />,
  )
  return onChange
}

describe("les renseignements de la fiche", () => {
  it("ferme la LV2 quand le tenant désactive ce niveau, mais conserve l'affichage historique", () => {
    renderFor(false)
    expect(screen.getByLabelText("LV2")).toBeDisabled()
    expect(screen.getByText(/désactivée pour ce niveau/)).toBeInTheDocument()
    expect(screen.getByLabelText("LV2")).toHaveTextContent("Allemand")
  })

  it("laisse la LV2 ouverte pour tout niveau autorisé, quel que soit son nom", () => {
    renderFor(true)
    expect(screen.getByLabelText("LV2")).not.toBeDisabled()
    expect(screen.getByLabelText("LV2")).toHaveTextContent("Allemand")
    expect(screen.queryByText(/désactivée pour ce niveau/)).toBeNull()
  })

  it("à la création, prévient que la qualité sera déduite du niveau antérieur", () => {
    const { rerender } = render(
      <EnrollmentProfileFields
        idPrefix="c"
        value={{ ...EMPTY_PROFILE, previous_level: "4E" }}
        onChange={vi.fn()}
        lv2Enabled={true}
        qualityHint="creation"
      />,
    )
    expect(screen.getByText(/sera déduite du niveau antérieur/)).toBeInTheDocument()

    rerender(
      <EnrollmentProfileFields
        idPrefix="c"
        value={{ ...EMPTY_PROFILE, previous_level: "4E" }}
        onChange={vi.fn()}
        lv2Enabled={true}
      />,
    )
    expect(screen.queryByText(/sera déduite du niveau antérieur/)).toBeNull()
  })

  it("propose la qualité en trois réponses, dont « Non renseigné »", () => {
    const onChange = renderFor(true)
    fireEvent.click(screen.getByRole("button", { name: "Redoublant" }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ is_repeater: true }),
      "is_repeater",
    )
    expect(screen.getByRole("button", { name: "Non renseigné" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })
})
