import { z } from "zod"

/**
 * Le point sur une catégorie de frais, tel que le serveur le rend.
 *
 * Deux champs commandent la lecture de tout le reste :
 *
 * - `consolide` dit si le document couvre toutes les caisses. Faux, il ne
 *   porte que celle de l'appelant — et ne peut alors rien dire des impayés.
 * - `remaining` vaut `null` dans ce cas, et non zéro. Un zéro se lirait comme
 *   un solde ; l'absence dit la vérité, qui est qu'on n'en sait rien d'ici.
 *
 * La même ligne de partage commande les champs de recouvrement — `total_attendu`,
 * `taux_recouvrement`, `compteurs` : ils se lisent sur tout l'argent reçu, donc
 * ils sont `null` sans le droit de lire toutes les caisses. Jamais approchés,
 * jamais mis à zéro.
 *
 * **Les champs ajoutés par l'outil de recouvrement sont tous facultatifs ici.**
 * Le schéma rejette la réponse entière au premier champ manquant, et l'écran
 * tomberait alors en bloc contre un serveur qui n'a pas encore la version qui
 * les porte. Chacun a donc une valeur de repli qui dit « on n'en sait rien »
 * plutôt qu'une valeur inventée — sauf `total_lignes`, dont le repli est le
 * nombre de lignes reçues : un serveur sans pagination les rend toutes, donc
 * ce nombre EST le compte du périmètre.
 */

export const LedgerStatusSchema = z.enum(["paid", "partial", "pending", "in_kind", "waived"])

export type LedgerStatus = z.infer<typeof LedgerStatusSchema>

/**
 * Les seaux qu'on peut demander au serveur.
 *
 * `impayes` n'est l'état d'aucune ligne : c'est le pseudo-seau de la liste
 * d'appel, qui réunit `pending` et `partial`. Il vaut pour l'export d'une
 * relance, pas pour un onglet — deux onglets dont les comptes se recouvrent
 * n'additionnent plus rien de lisible.
 */
export const LedgerBucketSchema = z.union([LedgerStatusSchema, z.literal("impayes")])

export type LedgerBucket = z.infer<typeof LedgerBucketSchema>

export const LedgerRowSchema = z.object({
  enrollment_id: z.number(),
  student_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  student_matricule: z.string().nullable().optional(),
  class_name: z.string(),
  status: LedgerStatusSchema,
  due: z.coerce.number(),
  /** Entré en argent sur la période demandée. */
  paid: z.coerce.number(),
  /** `null` quand l'appelant ne lit qu'une caisse : l'absence, pas un zéro. */
  remaining: z.coerce.number().nullable(),
  deposited_at: z.string().nullable(),
})

export const CategoryLedgerSchema = z.object({
  category_id: z.number(),
  category_name: z.string(),
  /** Faux, le bloc « en nature » n'a pas lieu d'être affiché. */
  accepts_in_kind: z.boolean(),
  class_name: z.string(),
  date_from: z.string().nullable(),
  date_to: z.string().nullable(),
  consolide: z.boolean(),

  /** Inscriptions ouvertes du périmètre. Ce n'est pas de l'argent : jamais cloisonné. */
  effectif_perimetre: z.number().optional(),
  /** Ceux qu'aucune ligne de cette catégorie ne couvre : absents du tableau. */
  eleves_sans_ligne: z.number().optional(),

  eleves_en_argent: z.number(),
  total_en_argent: z.coerce.number(),
  depots_en_nature: z.number(),
  eleves_restant_du: z.number().nullable(),
  total_restant_du: z.coerce.number().nullable(),

  /** Le dénominateur du recouvrement. `null` sans le droit de tout lire. */
  total_attendu: z.coerce.number().nullable().default(null),
  /** De 0 à 100. `null` sans ce droit, et `null` aussi quand rien n'est attendu. */
  taux_recouvrement: z.number().nullable().default(null),
  /** Le nombre de lignes par état, sur le périmètre entier — jamais sur la page. */
  compteurs: z.record(z.string(), z.number()).nullable().default(null),

  /** Les filtres de liste appliqués, tels que le serveur les a retenus. */
  etat_filtre: z.string().nullable().default(null),
  recherche: z.string().nullable().default(null),
  /** Vrai quand la liste vient du repêchage flou : l'écran doit le dire. */
  recherche_approchee: z.boolean().default(false),

  /** Lignes retenues par le filtre sur le périmètre, avant pagination. */
  total_lignes: z.number().optional(),
  page: z.number().default(1),
  size: z.number().optional(),
  /** Rempli quand le plafond a coupé. Tourner une page n'est pas une troncature. */
  truncated_from: z.number().nullable().default(null),

  lignes: z.array(LedgerRowSchema),
})

export type LedgerRow = z.infer<typeof LedgerRowSchema>
export type CategoryLedger = z.infer<typeof CategoryLedgerSchema>
