import { z } from "zod"

/**
 * Une tranche découpe le **total des frais obligatoires** dans le temps.
 *
 * Ce n'est pas une catégorie de frais : le trimestre est un moment de
 * paiement, pas une nature de frais. La grille de l'établissement est en
 * pourcentages pour suivre automatiquement le total de chaque élève ; un
 * accord négocié avec une famille est en montants fermes.
 */
export const FeeInstallmentSchema = z.object({
  id: z.number(),
  academic_year_id: z.number(),
  name: z.string(),
  position: z.number(),
  percentage: z.number(),
  due_date: z.string(),
})

export const ScheduleLineSchema = z.object({
  name: z.string(),
  position: z.number(),
  amount: z.number(),
  due_date: z.string(),
  is_due: z.boolean(),
})

export const EnrollmentScheduleSchema = z.object({
  enrollment_id: z.number(),
  /** `negotiated`, `standard`, ou `none` quand l'école n'a rien configuré. */
  source: z.string(),
  total_mandatory: z.number(),
  total_paid: z.number(),
  due_so_far: z.number(),
  late_amount: z.number(),
  is_late: z.boolean(),
  next_due_date: z.string().nullish(),
  next_due_amount: z.number().nullish(),
  lines: z.array(ScheduleLineSchema),
})

export type FeeInstallment = z.infer<typeof FeeInstallmentSchema>
export type ScheduleLine = z.infer<typeof ScheduleLineSchema>
export type EnrollmentSchedule = z.infer<typeof EnrollmentScheduleSchema>

export interface InstallmentDraft {
  name: string
  position: number
  percentage: number
  due_date: string
}

/** Total des pourcentages saisis, arrondi au centième pour éviter les 99.99999. */
export function percentageTotal(drafts: InstallmentDraft[]): number {
  return Math.round(drafts.reduce((sum, d) => sum + (d.percentage || 0), 0) * 100) / 100
}

/**
 * Une grille n'est valide que complète : une somme inférieure laisserait une
 * part des frais sans échéance, une somme supérieure réclamerait plus que le
 * montant dû.
 */
export function isGridComplete(drafts: InstallmentDraft[]): boolean {
  return drafts.length > 0 && percentageTotal(drafts) === 100
}

const SOURCE_LABELS: Record<string, string> = {
  negotiated: "Échéancier négocié avec la famille",
  standard: "Grille de l'établissement",
  none: "Aucune tranche configurée",
}

export function scheduleSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source
}
