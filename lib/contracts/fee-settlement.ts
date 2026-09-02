import { z } from "zod"

/**
 * Le tableau « qui a soldé quoi », tel que le serveur le rend.
 *
 * Aucun `.default()` ici : le serveur déclare ces champs obligatoires dans sa
 * réponse, et il ne peut pas en omettre un. Un repli les rendrait optionnels
 * à l'entrée du schéma — ce qui casse l'inférence de `safeValidate` — et,
 * surtout, il masquerait la seule chose qu'un champ manquant voudrait dire :
 * que le contrat a changé sans qu'on le sache.
 *
 * Les montants voyagent avec l'état plutôt que d'être recalculés ici : une
 * case « partiel » sans le reste dû obligerait l'écran à refaire la
 * soustraction, et deux calculs du même chiffre finissent par en contredire un.
 */
export const SettlementStateSchema = z.enum([
  "paid",
  "partial",
  "pending",
  "in_kind",
  "waived",
  "absent",
])

export type SettlementState = z.infer<typeof SettlementStateSchema>

export const SettlementColumnSchema = z.object({
  category_id: z.number(),
  name: z.string(),
  priority: z.number(),
})

export const SettlementCellSchema = z.object({
  category_id: z.number(),
  state: SettlementStateSchema,
  due: z.coerce.number(),
  paid: z.coerce.number(),
  remaining: z.coerce.number(),
})

export const SettlementRowSchema = z.object({
  enrollment_id: z.number(),
  student_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  student_matricule: z.string().nullable().optional(),
  cells: z.array(SettlementCellSchema),
  settled: z.boolean(),
})

export const SettlementMatrixSchema = z.object({
  class_name: z.string(),
  academic_year_name: z.string(),
  columns: z.array(SettlementColumnSchema),
  rows: z.array(SettlementRowSchema),
  settled_count: z.number(),
  total_count: z.number(),
})

export type SettlementColumn = z.infer<typeof SettlementColumnSchema>
export type SettlementCell = z.infer<typeof SettlementCellSchema>
export type SettlementRow = z.infer<typeof SettlementRowSchema>
export type SettlementMatrix = z.infer<typeof SettlementMatrixSchema>
