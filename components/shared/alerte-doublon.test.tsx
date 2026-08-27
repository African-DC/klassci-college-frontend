/**
 * Ce que le guichet doit lire, et ce qu'on ne doit pas lui laisser croire.
 *
 * Le risque n'est pas de rater un doublon : c'est d'afficher le même
 * avertissement dans tous les cas, jusqu'à ce qu'il soit cliqué sans être lu.
 * Un matricule identique est une certitude et doit se dire autrement qu'une
 * ressemblance de nom.
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { AlerteDoublon } from "./AlerteDoublon"
import type { Correspondance } from "@/lib/contracts/duplicates"

function correspondance(surcharge: Partial<Correspondance> = {}): Correspondance {
  return {
    student_id: 112,
    last_name: "CAMARA",
    first_name: "Wacaltchin laetitia",
    enrollment_number: "ECER0863",
    birth_date: null,
    birth_place: null,
    motif: "ressemblance",
    score: 0.94,
    champs_compares: ["last_name", "first_name"],
    juge_sur_peu: true,
    inscription_annee_courante: null,
    ...surcharge,
  }
}

describe("l'alerte de doublon", () => {
  it("ne s'affiche pas quand il n'y a rien à dire", () => {
    const { container } = render(<AlerteDoublon correspondances={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("annonce un matricule identique comme une certitude", () => {
    render(
      <AlerteDoublon
        correspondances={[correspondance({ motif: "matricule", score: null })]}
      />,
    )
    expect(screen.getByText(/matricule appartient déjà/i)).toBeInTheDocument()
  })

  it("dit quand le score ne porte que sur le nom et le prénom", () => {
    // La moitié du sens : « 94 % » calculé sur deux champs n'engage pas autant
    // que « 94 % » calculé sur l'état civil complet, et toutes les fiches
    // reprises de l'ancien système sont dans ce cas.
    render(<AlerteDoublon correspondances={[correspondance()]} />)
    expect(screen.getByText(/sur le nom et le prénom seuls/i)).toBeInTheDocument()
  })

  it("ne le dit pas quand la naissance a servi", () => {
    render(
      <AlerteDoublon
        correspondances={[
          correspondance({
            juge_sur_peu: false,
            champs_compares: ["last_name", "first_name", "birth_date", "birth_place"],
          }),
        ]}
      />,
    )
    expect(screen.queryByText(/sur le nom et le prénom seuls/i)).not.toBeInTheDocument()
  })

  it("signale une inscription déjà ouverte, même non validée", () => {
    // C'est le cas que personne ne voit : un dossier en attente n'apparaît pas
    // dans les listes que le secrétariat parcourt.
    render(
      <AlerteDoublon
        action="Poursuivre cette inscription"
        correspondances={[
          correspondance({
            inscription_annee_courante: {
              enrollment_id: 818,
              status: "prospect" as const,
              class_name: "3eme 2",
            },
          }),
        ]}
      />,
    )
    // « Dossier ouvert » est le libellé canonique de `prospect`. L'ancien texte
    // disait « en attente de validation », qui désigne l'état SUIVANT.
    expect(screen.getByText(/dossier ouvert/i)).toBeInTheDocument()
    expect(screen.getByText(/3eme 2/)).toBeInTheDocument()
    expect(screen.getByText(/en créerait une seconde/i)).toBeInTheDocument()
  })

  it("mène à la fiche existante plutôt que de laisser chercher", () => {
    render(<AlerteDoublon correspondances={[correspondance()]} />)
    const lien = screen.getByRole("link", { name: /CAMARA/ })
    expect(lien).toHaveAttribute("href", "/admin/students/112")
  })

  it("ne déroule pas une liste interminable", () => {
    const beaucoup = Array.from({ length: 7 }, (_, i) =>
      correspondance({ student_id: i + 1, first_name: `Eleve ${i}` }),
    )
    render(<AlerteDoublon correspondances={beaucoup} />)
    expect(screen.getAllByRole("link")).toHaveLength(4)
    expect(screen.getByText(/et 3 autres/i)).toBeInTheDocument()
  })
})
