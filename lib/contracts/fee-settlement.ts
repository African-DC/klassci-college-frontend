import { z } from "zod"

/**
 * Le tableau « qui a soldé quoi », tel que le serveur le rend.
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
  cells: z.array(SettlementCellSchema).default([]),
  settled: z.boolean(),
})

export const SettlementMatrixSchema = z.object({
  class_name: z.string().default(""),
  academic_year_name: z.string().default(""),
  columns: z.array(SettlementColumnSchema).default([]),
  rows: z.array(SettlementRowSchema).default([]),
  settled_count: z.number().default(0),
  total_count: z.number().default(0),
})

export type SettlementColumn = z.infer<typeof SettlementColumnSchema>
export type SettlementCell = z.infer<typeof SettlementCellSchema>
export type SettlementRow = z.infer<typeof SettlementRowSchema>
export type SettlementMatrix = z.infer<typeof SettlementMatrixSchema>

/**
 * Ce que chaque état s'appelle, et de quoi il se distingue.
 *
 * « Soldé » et « En nature » disent tous deux que plus rien n'est dû, mais
 * l'école ne les traite pas pareil : les fondre en un seul mot ferait
 * disparaître la question « a-t-il remis sa tenue ? ».
 */
export const SETTLEMENT_LABEL: Record<SettlementState, string> = {
  paid: "Soldé",
  partial: "Partiel",
  pending: "Dû",
  in_kind: "En nature",
  waived: "Exonéré",
  absent: "—",
}

/**
 * Une lettre par état, lue quand la couleur ne l'est pas.
 *
 * Le tableau se consulte en plein soleil sur un écran d'entrée de gamme, et
 * un daltonien ne distingue pas l'ambre du vert. La couleur reste, mais elle
 * ne porte jamais l'information seule.
 */
export const SETTLEMENT_MARK: Record<SettlementState, string> = {
  paid: "S",
  partial: "P",
  pending: "D",
  in_kind: "N",
  waived: "E",
  absent: "",
}

/** Les états qui ne doivent plus rien, dépôts et exonérations compris. */
export function isSettled(state: SettlementState): boolean {
  return state === "paid" || state === "in_kind" || state === "waived" || state === "absent"
}
