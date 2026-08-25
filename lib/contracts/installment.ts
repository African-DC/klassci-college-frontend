import { z } from "zod"

/**
 * Une tranche découpe le **total des frais obligatoires** dans le temps.
 *
 * Ce n'est pas une catégorie de frais : le trimestre est un moment de
 * paiement, pas une nature de frais. Chaque ligne de la grille s'exprime au
 * choix en pourcentage ou en montant ferme, et les deux se mélangent : l'école
 * pose en francs ce qu'elle connaît déjà — l'inscription, annoncée telle
 * quelle dans sa brochure — et laisse les pourcentages absorber la scolarité,
 * qui change d'un niveau à l'autre. Un accord négocié avec une famille, lui,
 * est toujours en montants fermes.
 */
export const InstallmentKindSchema = z.enum(["percentage", "fixed"])

export const FeeInstallmentSchema = z.object({
  id: z.number(),
  academic_year_id: z.number(),
  name: z.string(),
  position: z.number(),
  kind: InstallmentKindSchema,
  /** Renseigné pour les tranches en pourcentage seulement. */
  percentage: z.number().nullish(),
  /** Renseigné pour les tranches en montant ferme seulement. */
  amount: z.number().nullish(),
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
  /** Part des frais qu'aucune tranche ne planifie. Absente sur un ancien serveur. */
  unscheduled_amount: z.number().nullish(),
  lines: z.array(ScheduleLineSchema),
})

export type InstallmentKind = z.infer<typeof InstallmentKindSchema>
export type FeeInstallment = z.infer<typeof FeeInstallmentSchema>
export type ScheduleLine = z.infer<typeof ScheduleLineSchema>
export type EnrollmentSchedule = z.infer<typeof EnrollmentScheduleSchema>

export interface InstallmentDraft {
  name: string
  position: number
  kind: InstallmentKind
  /** Rempli quand `kind` vaut `percentage`, laissé vide sinon. */
  percentage: number | null
  /** Rempli quand `kind` vaut `fixed`, laissé vide sinon. */
  amount: number | null
  due_date: string
}

/** Total des pourcentages saisis, arrondi au centième pour éviter les 99.99999. */
export function percentageTotal(
  lines: { kind: InstallmentKind; percentage?: number | null }[],
): number {
  const somme = lines
    .filter((l) => l.kind === "percentage")
    .reduce((total, l) => total + (l.percentage || 0), 0)
  return Math.round(somme * 100) / 100
}

/** Somme des tranches exprimées en francs. */
export function fixedTotal(lines: { kind: InstallmentKind; amount?: number | null }[]): number {
  return lines.filter((l) => l.kind === "fixed").reduce((total, l) => total + (l.amount || 0), 0)
}

export function hasPercentageLine(lines: { kind: InstallmentKind }[]): boolean {
  return lines.some((l) => l.kind === "percentage")
}

/**
 * Une grille est valide si ses pourcentages, quand il y en a, couvrent
 * exactement l'assiette restante : une somme inférieure laisserait une part
 * des frais sans échéance, une somme supérieure réclamerait plus que le dû.
 *
 * Une grille faite uniquement de montants fermes est légitime et n'est
 * contrainte par aucune somme : le total obligatoire change d'un niveau à
 * l'autre, l'imposer ici reviendrait à bloquer une école sur un chiffre
 * inventé. L'écran annonce la somme et la simule à la place.
 */
export function isGridComplete(lines: { kind: InstallmentKind; percentage?: number | null }[]): boolean {
  if (lines.length === 0) return false
  if (!hasPercentageLine(lines)) return true
  return percentageTotal(lines) === 100
}

/**
 * Chiffre une grille sur une assiette donnée, dans l'ordre des échéances.
 *
 * Miroir exact de `resolve_grid_amounts` côté serveur, pour que la simulation
 * affichée avant enregistrement soit celle que les familles recevront : les
 * montants fermes se prélèvent d'abord sur le total, les pourcentages se
 * répartissent sur ce qui reste, et la dernière tranche en pourcentage absorbe
 * l'arrondi pour qu'aucun franc ne se perde.
 *
 * Un montant ferme est borné par ce qui reste : une grille bâtie pour un non
 * affecté ne présente pas à un affecté subventionné une dette qu'il n'a pas.
 */
export function simulateGrid(
  total: number,
  lines: { kind: InstallmentKind; percentage?: number | null; amount?: number | null }[],
): number[] {
  if (lines.length === 0) return []

  let reste = Math.max(total, 0)
  const montants: (number | null)[] = lines.map(() => null)

  lines.forEach((ligne, index) => {
    if (ligne.kind !== "fixed") return
    const preleve = Math.min(Math.max(ligne.amount || 0, 0), reste)
    montants[index] = preleve
    reste -= preleve
  })

  const indexesPourcentage = lines
    .map((ligne, index) => (ligne.kind === "percentage" ? index : -1))
    .filter((index) => index >= 0)

  let distribue = 0
  indexesPourcentage.forEach((index, rang) => {
    const dernier = rang === indexesPourcentage.length - 1
    const part = dernier
      ? reste - distribue
      : Math.round((reste * (lines[index].percentage || 0)) / 100)
    montants[index] = part
    distribue += part
  })

  return montants.map((montant) => montant ?? 0)
}

const SOURCE_LABELS: Record<string, string> = {
  negotiated: "Échéancier négocié avec la famille",
  standard: "Grille de l'établissement",
  none: "Aucune tranche configurée",
}

export function scheduleSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source
}
