/**
 * Un dossier ouvert n'est pas un dossier inexistant.
 *
 * La liste des élèves affichait « À inscrire » à tout élève sans inscription
 * *validée*. Un élève dont le dossier était en attente depuis des semaines
 * apparaissait donc comme n'ayant rien entamé, et le badge invitait à rouvrir
 * une inscription déjà ouverte.
 */

import { describe, expect, it } from "vitest"
import { enrollmentStatusView } from "./status"

describe("ce qu'un statut d'inscription dit à l'écran", () => {
  it("distingue un dossier en cours d'une inscription acquise", () => {
    expect(enrollmentStatusView("en_validation").enCours).toBe(true)
    expect(enrollmentStatusView("prospect").enCours).toBe(true)
    expect(enrollmentStatusView("valide").enCours).toBe(false)
  })

  it("ne dit jamais « à inscrire » d'un dossier déjà ouvert", () => {
    for (const statut of ["prospect", "en_validation", "valide", "rejete", "annule"]) {
      expect(enrollmentStatusView(statut).label.toLowerCase()).not.toContain("à inscrire")
    }
  })

  it("donne un libellé lisible, pas la valeur de la base", () => {
    expect(enrollmentStatusView("en_validation").label).toBe("En attente de validation")
    expect(enrollmentStatusView("valide").label).toBe("Inscrit")
  })

  it("ne fait pas disparaître une ligne au statut inconnu", () => {
    // Un statut ajouté côté serveur et pas encore ici doit rester visible.
    expect(enrollmentStatusView("nouveau_statut").label).toBe("nouveau_statut")
  })

  it("tolère l'absence de statut", () => {
    expect(enrollmentStatusView(null).label).toBe("—")
    expect(enrollmentStatusView(undefined).enCours).toBe(false)
  })
})
