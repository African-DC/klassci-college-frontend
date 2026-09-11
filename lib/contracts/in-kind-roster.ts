import { z } from "zod"

/**
 * La liste de saisie en lot : une classe, ses élèves, ce qu'il reste à cocher.
 *
 * Un éducateur repasse derrière soixante-dix-huit inscriptions pour dire qui
 * est nouveau et qui a déposé son paquet de rames. Fiche par fiche, en
 * changeant d'onglet à chaque fois, le travail ne se termine pas.
 */

/** Un article que cette inscription-là peut recevoir en dépôt. */
export const DepositableFeeSchema = z.object({
  fee_id: z.number(),
  fee_category_id: z.number(),
  category_name: z.string(),
  /** `pending` reste à déposer, `in_kind` déjà déposé. */
  status: z.string(),
})

export const InKindRosterRowSchema = z.object({
  enrollment_id: z.number(),
  student_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  /**
   * `null` = profil non tranché, et il le reste.
   *
   * L'écran n'a rien à pré-cocher : décider à la place de l'éducateur, c'est
   * facturer un ancien élève comme un arrivant.
   */
  is_new_student: z.boolean().nullable(),
  fees: z.array(DepositableFeeSchema),
})

export const InKindRosterSchema = z.object({
  items: z.array(InKindRosterRowSchema),
})

/**
 * Les articles déposables d'une seule inscription, sans un montant dedans.
 *
 * C'est ce que lit la fiche d'inscription pour qui n'a pas le droit de lire la
 * caisse. Le détail des frais est fait de sommes, donc fermé à l'éducateur —
 * et l'écran lui répondait une porte close là où il a le droit de déclarer un
 * dépôt. Le nom de l'article et son état suffisent à savoir quoi proposer.
 */
export const DepositableFeeListSchema = z.object({
  items: z.array(DepositableFeeSchema),
})

export type DepositableFee = z.infer<typeof DepositableFeeSchema>
export type InKindRosterRow = z.infer<typeof InKindRosterRowSchema>
export type InKindRoster = z.infer<typeof InKindRosterSchema>
export type DepositableFeeList = z.infer<typeof DepositableFeeListSchema>

/**
 * Le geste qu'un écran peut proposer sur un article.
 *
 * `aucun` couvre les lignes réglées, partiellement réglées ou exonérées : leur
 * catégorie accepte le dépôt, mais celle-ci n'attend plus rien. Le serveur
 * refuse alors les deux gestes, et un bouton qui répond « un versement y est
 * déjà imputé » vaut moins que pas de bouton du tout.
 */
export type GesteDepot = "deposer" | "annuler" | "aucun"

/** Ce qu'on peut faire de cet article, et rien d'autre. */
export function gesteDepot(fee: DepositableFee): GesteDepot {
  if (fee.status === "in_kind") return "annuler"
  if (fee.status === "pending") return "deposer"
  return "aucun"
}

/**
 * Ce qui reste à renseigner sur cette ligne.
 *
 * Sert à montrer l'avancement sans faire compter l'éducateur : sur une liste
 * de quarante, savoir combien il en reste est ce qui décide s'il ira au bout.
 */
export function ligneComplete(row: InKindRosterRow): boolean {
  return row.is_new_student !== null
}
