/** La LV2 depend exclusivement du booleen de niveau renvoye par le tenant. */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EMPTY_PROFILE, lv2AllowedForClass } from "@/lib/contracts/enrollment-profile"
import { EnrollmentProfileFields } from "./EnrollmentProfileFields"

function renderFor(lv2Enabled: boolean | undefined, onChange = vi.fn()) {
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
  it("refuse l'edition sans autorisation explicite du niveau", () => {
    renderFor(false)
    expect(screen.queryByRole("combobox", { name: "LV2" })).toBeNull()
    expect(screen.getByText(/LV2 non disponible/)).toBeInTheDocument()
  })

  it("autorise une LV2 meme sur un niveau renomme", () => {
    renderFor(true)
    expect(screen.getByLabelText("LV2")).not.toBeDisabled()
    expect(screen.getByLabelText("LV2")).toHaveTextContent("Allemand")
  })

  it("aucun nom ne determine la politique, et une reponse manquante ferme l'edition", () => {
    expect(lv2AllowedForClass(true)).toBe(true)
    expect(lv2AllowedForClass(false)).toBe(false)
    expect(lv2AllowedForClass(undefined)).toBe(false)
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

    // Hors création, le serveur ne déduit rien : on ne le promet pas.
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
    // Le champ touché accompagne la valeur : les écrans de correction en
    // déduisent si la qualité doit partir ou être recalculée par le serveur.
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
