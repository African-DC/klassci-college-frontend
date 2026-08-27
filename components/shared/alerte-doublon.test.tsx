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
    motif: "ressemblance",
    score: 0.94,
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

  it("dit quand une partie de l état civil manque", () => {
    // La moitié du sens : « 94 % » calculé sur deux champs n'engage pas autant
    // que « 94 % » calculé sur l'état civil complet, et toutes les fiches
    // reprises de l'ancien système sont dans ce cas.
    render(<AlerteDoublon correspondances={[correspondance()]} />)
    // La réserve ne nomme plus les champs : elle disait « le nom et le prénom »
    // pour une comparaison qui n avait vu que le nom.
    expect(screen.getByText(/état civil incomplet/i)).toBeInTheDocument()
  })

  it("ne le dit pas quand la naissance a servi", () => {
    render(
      <AlerteDoublon
        correspondances={[
          correspondance({
            juge_sur_peu: false,
          }),
        ]}
      />,
    )
    expect(screen.queryByText(/état civil incomplet/i)).not.toBeInTheDocument()
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
    // La phrase entière est vérifiée par le bloc dédié plus bas.
    expect(screen.getByText(/dossier ouvert/i)).toBeInTheDocument()
    expect(screen.getByText(/3eme 2/)).toBeInTheDocument()
    expect(screen.getByText(/en créerait un second/i)).toBeInTheDocument()
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

describe("ce que l'écran dit quand il n'a rien à montrer", () => {
  it("distingue « en cours de vérification » de « rien trouvé »", () => {
    // Sans cela, les 400 ms de temporisation plus l'aller-retour réseau
    // ressemblent à un feu vert, sur un formulaire dont l'objet est
    // d'empêcher une erreur.
    render(<AlerteDoublon correspondances={[]} enCours />)
    expect(screen.getByText(/vérification des doublons/i)).toBeInTheDocument()
  })

  it("distingue « vérification impossible » de « rien trouvé »", () => {
    render(<AlerteDoublon correspondances={[]} echec />)
    expect(screen.getByText(/impossible/i)).toBeInTheDocument()
    expect(screen.getByText(/contrôlez le matricule/i)).toBeInTheDocument()
  })

  it("ne dit rien quand la vérification est faite et propre", () => {
    const { container } = render(<AlerteDoublon correspondances={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe("ce que l'écran donne pour trancher", () => {
  it("affiche la date de naissance, qui est l'élément décisif", () => {
    render(
      <AlerteDoublon
        correspondances={[correspondance({ birth_date: "2010-03-14" })]}
      />,
    )
    expect(screen.getByText(/14\/03\/2010/)).toBeInTheDocument()
  })

  it("prévient quand la recherche s'est arrêtée avant la fin", () => {
    render(<AlerteDoublon correspondances={[correspondance()]} tronque />)
    expect(screen.getByText(/arrêtée avant la fin/i)).toBeInTheDocument()
  })

  it("annonce une collision de matricule au lieu de la classer", () => {
    // `role="status"` est lu quand le lecteur d'écran en a le temps ;
    // `role="alert"` interrompt. Un matricule déjà pris mérite l'interruption.
    render(<AlerteDoublon correspondances={[correspondance({ motif: "matricule" })]} />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })
})

describe("une liste périmée ne doit pas passer pour une vérification fraîche", () => {
  it("le dit quand la dernière vérification a échoué, liste non vide", () => {
    // TanStack conserve les données précédentes après un échec de
    // rechargement : sans ce message, la personne lit une liste ancienne
    // comme si elle venait d'être établie.
    render(<AlerteDoublon correspondances={[correspondance()]} echec />)
    expect(screen.getByText(/dernière vérification a échoué/i)).toBeInTheDocument()
    expect(screen.getByText(/périmée/i)).toBeInTheDocument()
  })

  it("ne suppose pas le genre de l'élève", () => {
    // « née le » pour tout le monde était faux pour la moitié de l'effectif.
    render(<AlerteDoublon correspondances={[correspondance({ birth_date: "2010-03-14" })]} />)
    expect(screen.getByText(/né\(e\) le/)).toBeInTheDocument()
  })
})

describe("une liste vide a quatre sens", () => {
  it("dit qu'une recherche interrompue n'est pas une recherche propre", () => {
    // Le serveur lève ce drapeau quand il s'arrête au plafond de candidats.
    // L'écran l'ignorait : « je me suis arrêté et je n'ai rien vu » et
    // « vérifié, rien trouvé » rendaient le même vide.
    render(<AlerteDoublon correspondances={[]} tronque />)
    expect(screen.getByText(/interrompue avant la fin/i)).toBeInTheDocument()
    expect(screen.getByText(/contrôlez le matricule/i)).toBeInTheDocument()
  })

  it("ne dit rien quand la recherche est allée au bout sans rien trouver", () => {
    const { container } = render(<AlerteDoublon correspondances={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("l'échec prime sur la troncature", () => {
    // Une recherche qui a échoué n'a rien vérifié du tout : le dire avant.
    render(<AlerteDoublon correspondances={[]} echec tronque />)
    expect(screen.getByText(/impossible/i)).toBeInTheDocument()
  })
})

describe("la phrase que la secrétaire lit avant de décider", () => {
  it.each([
    ["prospect", "dossier ouvert"],
    ["en_validation", "en attente de validation"],
    ["valide", "inscrit"],
  ])("reste du français pour le statut %s", (statut, attendu) => {
    // Le libellé vient d'un badge. Coulé dans la phrase, il donnait
    // « a déjà une inscription dossier ouvert en 3eme 2 » — et `prospect`
    // est justement le cas pour lequel la fonctionnalité existe.
    //
    // On lit le paragraphe ENTIER : JSX le découpe en nœuds de texte, et
    // chercher un fragment isolé ne voit jamais la phrase.
    const { container } = render(
      <AlerteDoublon
        action="Créer cette fiche"
        correspondances={[
          correspondance({
            inscription_annee_courante: {
              enrollment_id: 818,
              status: statut as "prospect",
              class_name: "3eme 2",
            },
          }),
        ]}
      />,
    )
    const phrase = Array.from(container.querySelectorAll("p"))
      .map((p) => p.textContent ?? "")
      .find((t) => t.includes("a déjà un dossier"))
    expect(phrase).toBeDefined()
    expect(phrase).toContain("a déjà un dossier pour cette année en 3eme 2")
    expect(phrase).toContain(`(statut : ${attendu})`)
    expect(phrase).toContain("en créerait un second")
  })
})
