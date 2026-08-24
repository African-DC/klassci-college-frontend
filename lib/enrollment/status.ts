/**
 * Ce qu'un statut d'inscription dit à l'écran.
 *
 * Deux écrans en gardaient chacun leur copie, et la liste des élèves n'en
 * avait aucune : elle affichait le statut brut de la base, `en_validation`,
 * et surtout elle traitait toute inscription non validée comme inexistante.
 * Un élève dont le dossier était ouvert depuis des semaines s'affichait donc
 * « À inscrire », invitant à rouvrir un dossier déjà ouvert.
 */

export type EnrollmentStatus = "prospect" | "en_validation" | "valide" | "rejete" | "annule"

export interface EnrollmentStatusView {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
  /** Vrai tant que l'inscription n'est ni acquise ni abandonnée. */
  enCours: boolean
}

const STATUTS: Record<EnrollmentStatus, EnrollmentStatusView> = {
  prospect: { label: "Dossier ouvert", variant: "secondary", enCours: true },
  en_validation: { label: "En attente de validation", variant: "secondary", enCours: true },
  valide: { label: "Inscrit", variant: "default", enCours: false },
  rejete: { label: "Rejeté", variant: "destructive", enCours: false },
  annule: { label: "Annulé", variant: "destructive", enCours: false },
}

/** Un statut inconnu s'affiche tel quel plutôt que de faire disparaître la ligne. */
export function enrollmentStatusView(statut: string | null | undefined): EnrollmentStatusView {
  if (!statut) return { label: "—", variant: "outline", enCours: false }
  return STATUTS[statut as EnrollmentStatus] ?? { label: statut, variant: "outline", enCours: false }
}
