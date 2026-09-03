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
 */

export const LedgerStatusSchema = z.enum(["paid", "partial", "pending", "in_kind", "waived"])

export type LedgerStatus = z.infer<typeof LedgerStatusSchema>

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
  eleves_en_argent: z.number(),
  total_en_argent: z.coerce.number(),
  depots_en_nature: z.number(),
  eleves_restant_du: z.number().nullable(),
  total_restant_du: z.coerce.number().nullable(),
  lignes: z.array(LedgerRowSchema),
})

export type LedgerRow = z.infer<typeof LedgerRowSchema>
export type CategoryLedger = z.infer<typeof CategoryLedgerSchema>
