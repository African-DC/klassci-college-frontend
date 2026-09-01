import { z } from "zod"

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


/**
 * Le socle obligatoire d'un niveau pour un public, calculé par le serveur.
 *
 * L'écran calculait ce total lui-même, en réimplémentant l'arbitrage du tarif
 * le plus spécifique. La règle vivait donc dans deux langages et elle a
 * divergé : la version de l'écran oubliait d'écarter les tarifs d'une série
 * étrangère, et la simulation annonçait des francs que l'élève ne paierait
 * jamais. Elle est rendue au serveur, qui la porte déjà pour le guichet.
 */
export const MandatoryBasketLineSchema = z.object({
  level_id: z.number(),
  assignment_scope: z.string(),
  enrollment_profile: z.string().nullable(),
  total: z.coerce.number(),
})

export const MandatoryBasketSchema = z.object({
  items: z.array(MandatoryBasketLineSchema),
})

export type MandatoryBasketLine = z.infer<typeof MandatoryBasketLineSchema>
export type MandatoryBasket = z.infer<typeof MandatoryBasketSchema>

/** Le total d'un public dans le tableau rendu, `undefined` s'il n'y figure pas. */
export function basketTotal(
  basket: MandatoryBasket | undefined,
  levelId: number | undefined,
  audience: FeeAudience,
): number | undefined {
  if (!basket || !levelId) return undefined
  return basket.items.find(
    (l) =>
      l.level_id === levelId &&
      l.assignment_scope === audience.assignment_scope &&
      (l.enrollment_profile ?? null) === audience.enrollment_profile,
  )?.total
}
