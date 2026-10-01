/**
 * La LV2 commence en 4ème : en 6ème et en 5ème, le champ est fermé et dit
 * pourquoi, plutôt que de laisser saisir une valeur que le serveur refuserait.
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EMPTY_PROFILE, lv2AllowedForLevel } from "@/lib/contracts/enrollment-profile"
import { EnrollmentProfileFields } from "./EnrollmentProfileFields"

function renderFor(levelName: string | null, onChange = vi.fn()) {
  render(
    <EnrollmentProfileFields
      idPrefix="t"
      value={{ ...EMPTY_PROFILE, lv2: "allemand" }}
      onChange={onChange}
      levelName={levelName}
    />,
  )
  return onChange
}

describe("les renseignements de la fiche", () => {
  it("ferme la LV2 en 6ème et explique pourquoi", () => {
    renderFor("6ème")
    expect(screen.getByLabelText("LV2")).toBeDisabled()
    expect(screen.getByText(/La LV2 commence en 4ème/)).toBeInTheDocument()
    // La valeur héritée d'une autre classe ne s'affiche pas : « Non concerné ».
    expect(screen.getByLabelText("LV2")).toHaveTextContent("Non concerné")
  })

  it("laisse la LV2 ouverte en 4ème", () => {
    renderFor("4ème")
    expect(screen.getByLabelText("LV2")).not.toBeDisabled()
    expect(screen.getByLabelText("LV2")).toHaveTextContent("Allemand")
    expect(screen.queryByText(/La LV2 commence en 4ème/)).toBeNull()
  })

  it("reconnaît la 6ème et la 5ème sous leurs écritures courantes", () => {
    for (const name of ["6ème", "6e", "6eme", "5ème", "5e A", "Sixième", "cinquième"]) {
      expect(lv2AllowedForLevel(name), name).toBe(false)
    }
    for (const name of ["4ème", "3e", "2nde", "Terminale", null]) {
      expect(lv2AllowedForLevel(name), String(name)).toBe(true)
    }
  })

  it("propose la qualité en trois réponses, dont « Non renseigné »", () => {
    const onChange = renderFor("4ème")
    fireEvent.click(screen.getByRole("button", { name: "Redoublant" }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ is_repeater: true }))
    expect(screen.getByRole("button", { name: "Non renseigné" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })
})
