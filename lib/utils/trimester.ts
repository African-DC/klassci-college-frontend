// Libellés des trimestres (calendrier scolaire ivoirien : 3 trimestres par AY).
// Source canonique partagée entre composants (charts, bulletins, council, etc.).

export const TRIMESTER_NUMBERS = [1, 2, 3] as const
export type TrimesterNumber = (typeof TRIMESTER_NUMBERS)[number]

export const TRIMESTER_SHORT_LABEL: Record<TrimesterNumber, string> = {
  1: "T1",
  2: "T2",
  3: "T3",
}

export const TRIMESTER_FULL_LABEL: Record<TrimesterNumber, string> = {
  1: "1er trimestre",
  2: "2ème trimestre",
  3: "3ème trimestre",
}

export function trimesterShortLabel(n: number): string {
  return TRIMESTER_SHORT_LABEL[n as TrimesterNumber] ?? `T${n}`
}

export function trimesterFullLabel(n: number): string {
  return TRIMESTER_FULL_LABEL[n as TrimesterNumber] ?? `${n}e trimestre`
}
