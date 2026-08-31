import type { AssignmentScope, EnrollmentProfile } from "./fee"
import { enrollmentProfileBadge } from "./fee"

/**
 * À qui un tarif est facturé, et comment l'écran tranche entre deux tarifs
 * qui pourraient tous les deux s'appliquer.
 *
 * Le serveur arbitre déjà ainsi au moment d'inscrire un élève. Tout écran qui
 * annonce un montant AVANT l'inscription doit arbitrer pareil, sinon il promet
 * une somme que la facture ne confirmera pas. Un seul endroit porte la règle,
 * pour qu'elle ne diverge pas d'un écran à l'autre.
 */

/** L'élève dont on parle, par opposition au public visé par un tarif. */
export interface FeeAudience {
  assignment_scope: Exclude<AssignmentScope, null>
  /** `null` = le profil n'a pas été tranché, et rien ne permet de le deviner. */
  enrollment_profile: EnrollmentProfile
  /**
   * La série de la classe, `null` ou absente quand aucune n'est désignée.
   *
   * Le serveur écarte les tarifs d'une série quand la classe n'en a pas :
   * une classe sans série ne peut recevoir que les tarifs du tronc commun.
   * L'écran doit écarter les mêmes, sinon il chiffre une facture que la
   * caisse n'émettra jamais.
   */
  series_id?: number | null
}

/** Les seules dimensions d'un tarif qui décident à qui il est facturé. */
export interface TargetedVariant {
  fee_category_id: number
  series_id?: number | null
  assignment_scope?: string | null
  enrollment_profile?: string | null
}

/** Situations d'affectation, dans l'ordre d'affichage. */
export const AUDIENCE_SCOPES: { value: FeeAudience["assignment_scope"]; label: string }[] = [
  { value: "non_affecte", label: "Non affecté" },
  { value: "affecte", label: "Affecté" },
]

/**
 * Profils d'un élève simulé, dans l'ordre d'affichage.
 *
 * « Non tranché » n'est pas une commodité de formulaire : c'est l'état réel
 * d'une école dont l'historique n'est pas encore saisi. Un tarif réservé à un
 * profil ne lui est alors pas facturé, et la simulation doit le dire au lieu
 * de choisir un profil à sa place.
 */
export const AUDIENCE_PROFILES: {
  value: EnrollmentProfile
  label: string
  /** Version qui s'insère dans une phrase : « pour un élève affecté, … ». */
  phrase: string
  hint: string
}[] = [
  {
    value: "nouveau",
    label: "Nouvel élève",
    phrase: "première inscription",
    hint: "Première inscription dans l'établissement",
  },
  {
    value: "ancien",
    label: "Déjà inscrit avant",
    phrase: "réinscription",
    hint: "L'élève était déjà dans l'établissement l'an dernier",
  },
  {
    value: null,
    label: "Profil non tranché",
    phrase: "profil non tranché",
    hint: "Les tarifs réservés à un profil ne lui sont pas facturés",
  },
]

/**
 * Ce public paie-t-il ce tarif ?
 *
 * Un tarif sans restriction s'applique à tout le monde. Un tarif restreint ne
 * donne pas un autre montant aux autres : il ne leur est pas facturé du tout.
 * Le profil non tranché ne correspond donc à aucun tarif ciblé, et c'est
 * voulu : facturer sur une supposition, c'est facturer au hasard.
 */
export function variantAppliesTo(variant: TargetedVariant, audience: FeeAudience): boolean {
  const scope = variant.assignment_scope ?? null
  const profile = variant.enrollment_profile ?? null
  const series = variant.series_id ?? null
  if (scope !== null && scope !== audience.assignment_scope) return false
  if (profile !== null && profile !== audience.enrollment_profile) return false
  // Même règle que `applicable_series_keys` côté serveur : un tarif de série
  // ne vaut que pour cette série, et une audience qui n'en désigne aucune ne
  // reçoit que le tronc commun.
  if (series !== null && series !== (audience.series_id ?? null)) return false
  return true
}

/**
 * Le poids de chaque dimension dans l'arbitrage, du plus fort au plus faible.
 *
 * Même ordre que `_specificity` côté serveur, et pour la même raison :
 * l'affectation passe devant le profil parce qu'elle change le montant du
 * simple au double en Côte d'Ivoire, quand le profil ajoute ou retire une
 * ligne. La série vient en dernier, et une série renseignée l'emporte, parce
 * que `variantAppliesTo` a déjà écarté celles qui ne concernent pas cette
 * audience : il ne reste que des tarifs applicables, et parmi eux le plus
 * précis gagne.
 *
 * L'ancien barème donnait un point au tronc commun au lieu d'écarter les
 * séries étrangères : un tarif de série A pouvait alors l'emporter sur le
 * tarif du niveau dans une simulation qui ne désigne aucune série.
 */
const POIDS_AFFECTATION = 4
const POIDS_PROFIL = 2
const POIDS_SERIE = 1

export function variantSpecificity(variant: TargetedVariant): number {
  return (
    (variant.assignment_scope ? POIDS_AFFECTATION : 0) +
    (variant.enrollment_profile ? POIDS_PROFIL : 0) +
    (variant.series_id == null ? 0 : POIDS_SERIE)
  )
}

/**
 * Un tarif au plus par catégorie, le plus précis qui s'adresse à ce public.
 *
 * Une catégorie ne produit qu'une ligne de frais par inscription. En retenir
 * deux, c'est facturer deux fois la même scolarité ; en retenir le plus
 * général alors qu'un tarif précis existe, c'est annoncer le plein tarif à un
 * élève subventionné.
 */
export function mostSpecificVariantPerCategory<T extends TargetedVariant>(
  variants: T[],
  audience: FeeAudience,
): T[] {
  const retenus = new Map<number, T>()

  for (const variant of variants) {
    if (!variantAppliesTo(variant, audience)) continue
    const actuel = retenus.get(variant.fee_category_id)
    if (!actuel || variantSpecificity(variant) > variantSpecificity(actuel)) {
      retenus.set(variant.fee_category_id, variant)
    }
  }

  return [...retenus.values()]
}

/**
 * Pour quel public un montant simulé vaut, dit en toutes lettres.
 *
 * Se glisse dans une phrase : « pour un élève non affecté, première
 * inscription ». Un total qui ne nomme pas son public se recopie ensuite dans
 * un règlement intérieur comme s'il valait pour toute l'école.
 */
export function audienceLabel(audience: FeeAudience): string {
  const scope = AUDIENCE_SCOPES.find((s) => s.value === audience.assignment_scope)?.label ?? ""
  const profil =
    AUDIENCE_PROFILES.find((p) => p.value === (audience.enrollment_profile ?? null))?.phrase ?? ""
  return `élève ${scope.toLowerCase()}, ${profil}`
}

/**
 * Ce qu'une somme de montants représente réellement.
 *
 * Additionner des tarifs qui s'excluent, ou qui appartiennent à des niveaux
 * différents, ne donne pas ce qu'un élève paie. Trois endroits de l'écran des
 * frais affichent une telle somme : ils lisent leur libellé ici, pour que la
 * même somme ne s'annonce pas de deux façons.
 */
export const FEE_SUM_PER_STUDENT = "Total / élève"
export const FEE_SUM_CUMULATED = "Cumul des tarifs"

export function feeSumLabel(estCumul: boolean): string {
  return estCumul ? FEE_SUM_CUMULATED : FEE_SUM_PER_STUDENT
}

/**
 * Le nom complet d'un tarif, toutes ses dimensions comprises.
 *
 * Deux tarifs de la même catégorie sur le même niveau coexistent
 * légitimement : l'un pour les affectés, l'autre pour les nouveaux. Les
 * nommer tous les deux « catégorie · niveau » revient à demander à l'école de
 * confirmer une suppression sans lui dire lequel des deux disparaît.
 */
export function feeVariantFullName(
  variant: TargetedVariant,
  names: { category: string; level?: string | null; series?: string | null },
): string {
  const morceaux: string[] = [names.category]
  if (names.level) morceaux.push(names.level)
  if (names.series) morceaux.push(`série ${names.series}`)
  else if (variant.series_id != null) morceaux.push("une série")

  const scope = AUDIENCE_SCOPES.find((s) => s.value === variant.assignment_scope)?.label
  if (scope) morceaux.push(scope.toLowerCase())

  const profil = enrollmentProfileBadge(variant.enrollment_profile)
  if (profil) morceaux.push(profil)

  return morceaux.join(" · ")
}
