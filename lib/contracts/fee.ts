import { z } from "zod"

// Miroir de app/schemas/fee.py (backend)

// Ce qu'une famille reçoit en échange d'un frais : un objet qu'on lui remet
// au guichet, ou un droit qui s'ouvre le jour du versement. La distinction
// n'est pas cosmétique : « remis » est une dette physique dont un parent peut
// revenir réclamer l'exécution, « accès » ne se retire pas au guichet.
export const FeeEntitlementSchema = z.object({
  label: z.string().min(1),
  quantity: z.number().int().positive().nullish(),
  // Pas de .default() : ce schéma alimente aussi le formulaire, et un défaut
  // Zod fait diverger le type d'entrée du type de sortie. Le composant de
  // saisie pose « objet remis » lui-même quand on ajoute une ligne.
  kind: z.enum(["item", "access"]),
})

export type FeeEntitlement = z.infer<typeof FeeEntitlementSchema>

/** Nombre maximum d'éléments par catégorie, aligné sur le backend. */
export const MAX_ENTITLEMENTS = 15

export const ENTITLEMENT_KINDS: { value: "item" | "access"; label: string; hint: string }[] = [
  {
    value: "item",
    label: "Objet remis",
    hint: "La famille vient le retirer : tenue, polo, macaron, manuel",
  },
  {
    value: "access",
    label: "Droit d'accès",
    hint: "Le droit s'ouvre au versement : infirmerie, bibliothèque, activités",
  },
]

// Categorie de frais (ex: Scolarite, Inscription, Cantine, Transport)
// is_mandatory=true  → frais obligatoires, montants via FeeVariant (par level+series)
// is_mandatory=false → frais optionnels, options nommees via OptionalFeeOption
export const FeeCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  // .optional() et pas .default([]) : `safeValidate` infère le type d'entrée du
  // schéma, et un défaut Zod y fait diverger entrée et sortie. L'absence est
  // normalisée à l'affichage, au même endroit que le frontend déployé avant
  // le backend qui renvoie ce champ.
  entitlements: z.array(FeeEntitlementSchema).optional(),
  is_mandatory: z.boolean(),
  accepts_in_kind: z.boolean().optional(),
  priority: z.number().int().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

// Variante de frais OBLIGATOIRE — montant par level + series + annee
export const FeeVariantSchema = z.object({
  id: z.number(),
  fee_category_id: z.number(),
  level_id: z.number(),
  series_id: z.number().nullable(),
  /**
   * `null` = ce montant s'applique à tout le monde. Sinon il ne vaut que
   * pour les élèves affectés, ou que pour les non affectés. En Côte d'Ivoire
   * un affecté est subventionné par l'État : il paie sensiblement moins.
   */
  assignment_scope: z.enum(["affecte", "non_affecte"]).nullish(),
  /**
   * `null` = ce montant s'applique à tout le monde. Sinon il ne vaut que pour
   * une première inscription, ou que pour un élève déjà passé par l'école.
   * Un tarif porté par un profil n'est pas un montant différent pour l'autre
   * profil : il ne lui est pas facturé du tout.
   */
  enrollment_profile: z.enum(["nouveau", "ancien"]).nullish(),
  academic_year_id: z.number(),
  amount: z.coerce.number(),
  description: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const FeeCategoryCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  description: z.string().nullable().optional(),
  entitlements: z.array(FeeEntitlementSchema).max(MAX_ENTITLEMENTS).optional(),
  is_mandatory: z.boolean().default(true),
  accepts_in_kind: z.boolean().optional(),
  /** Ordre d'imputation des versements : plus petit = servi en premier. */
  priority: z.number().int().min(0).max(999).optional(),
})

export const FeeVariantCreateSchema = z.object({
  fee_category_id: z.number({ required_error: "La catégorie est requise" }).positive(),
  level_id: z.number({ required_error: "Le niveau est requis" }).positive(),
  series_id: z.number().positive().nullable().optional(),
  assignment_scope: z.enum(["affecte", "non_affecte"]).nullable().optional(),
  // Envoyé à `null` remet le tarif à « tous les élèves ». Le serveur
  // distingue le champ absent du champ envoyé vide : l'écran l'envoie donc
  // toujours, même à `null`, sinon on ne pourrait jamais revenir en arrière.
  enrollment_profile: z.enum(["nouveau", "ancien"]).nullable().optional(),
  amount: z.number({ required_error: "Le montant est requis" }).positive("Le montant doit être positif"),
  academic_year_id: z.number({ required_error: "L'année académique est requise" }).positive(),
  description: z.string().nullable().optional(),
})

export const FeeCategoryUpdateSchema = FeeCategoryCreateSchema.partial()
export const FeeVariantUpdateSchema = FeeVariantCreateSchema.partial()

// Option de frais OPTIONNEL — option nommee pour une categorie optionnelle
export const OptionalFeeOptionSchema = z.object({
  id: z.number(),
  fee_category_id: z.number(),
  academic_year_id: z.number(),
  name: z.string(),
  amount: z.coerce.number(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const OptionalFeeOptionCreateSchema = z.object({
  fee_category_id: z.number({ required_error: "La catégorie est requise" }).positive(),
  academic_year_id: z.number({ required_error: "L'année académique est requise" }).positive(),
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  amount: z.number({ required_error: "Le montant est requis" }).positive("Le montant doit être positif"),
  description: z.string().nullable().optional(),
})

export const OptionalFeeOptionUpdateSchema = OptionalFeeOptionCreateSchema.partial()

// Schema formulaire UI (subset sans category_id/academic_year_id, injectés par le composant)
export const OptionalFeeOptionFormSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  amount: z.number({ required_error: "Le montant est requis" }).positive("Le montant doit être positif"),
  description: z.string().nullable().optional(),
})

export type FeeCategory = z.infer<typeof FeeCategorySchema>
export type FeeVariant = z.infer<typeof FeeVariantSchema>
export type OptionalFeeOption = z.infer<typeof OptionalFeeOptionSchema>
export type FeeCategoryCreate = z.infer<typeof FeeCategoryCreateSchema>
export type FeeCategoryUpdate = z.infer<typeof FeeCategoryUpdateSchema>
export type FeeVariantCreate = z.infer<typeof FeeVariantCreateSchema>
export type FeeVariantUpdate = z.infer<typeof FeeVariantUpdateSchema>
export type OptionalFeeOptionCreate = z.infer<typeof OptionalFeeOptionCreateSchema>
export type OptionalFeeOptionUpdate = z.infer<typeof OptionalFeeOptionUpdateSchema>

/** Niveaux du systeme scolaire ivoirien (college) */
export const LEVELS = ["6eme", "5eme", "4eme", "3eme"] as const


export type AssignmentScope = "affecte" | "non_affecte" | null

/** Portées d'affectation d'un montant, dans l'ordre d'affichage. */
export const ASSIGNMENT_SCOPES: {
  value: AssignmentScope
  label: string
  hint: string
}[] = [
  {
    value: null,
    label: "Tous les élèves",
    hint: "S'applique aussi bien aux affectés qu'aux non affectés",
  },
  {
    value: "affecte",
    label: "Élèves affectés",
    hint: "Subventionnés par l'État — les réaffectés sont inclus",
  },
  {
    value: "non_affecte",
    label: "Élèves non affectés",
    hint: "La famille prend la scolarité entièrement à sa charge",
  },
]

export function assignmentScopeLabel(scope: string | null | undefined): string {
  return ASSIGNMENT_SCOPES.find((s) => s.value === (scope ?? null))?.label ?? "Tous les élèves"
}

export type EnrollmentProfile = "nouveau" | "ancien" | null

/**
 * Profils d'inscription visés par un montant, dans l'ordre d'affichage.
 *
 * La phrase d'aide dit ce que le choix fait à la facture, pas seulement qui
 * il désigne : réserver un tarif aux nouveaux ne donne pas un autre montant
 * aux anciens, il ne leur est plus facturé du tout. C'est la chemise
 * cartonnée qu'on achète une fois, pas une remise de fidélité.
 */
export const ENROLLMENT_PROFILES: {
  value: EnrollmentProfile
  label: string
  /** Étiquette courte, pour la grille où la place manque. */
  badge: string | null
  hint: string
}[] = [
  {
    value: null,
    label: "Tous les élèves",
    badge: null,
    hint: "Facturé aussi bien à une première inscription qu'à une réinscription",
  },
  {
    value: "nouveau",
    label: "Nouveaux élèves",
    badge: "nouveaux",
    hint: "Facturé à une première inscription seulement. Les anciens ne le paient pas du tout.",
  },
  {
    value: "ancien",
    label: "Anciens élèves",
    badge: "anciens",
    hint: "Facturé aux élèves déjà passés par l'école. Les nouveaux ne le paient pas du tout.",
  },
]

export function enrollmentProfileLabel(profile: string | null | undefined): string {
  return ENROLLMENT_PROFILES.find((p) => p.value === (profile ?? null))?.label ?? "Tous les élèves"
}

/** `null` quand le tarif vaut pour tout le monde : rien à signaler dans la grille. */
export function enrollmentProfileBadge(profile: string | null | undefined): string | null {
  return ENROLLMENT_PROFILES.find((p) => p.value === (profile ?? null))?.badge ?? null
}

