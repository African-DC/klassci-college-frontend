// Le BE renvoie `class_name: "—"` comme sentinelle pour "élève pas inscrit
// dans l'année courante" (au lieu de null ou is_enrolled bool explicite).
// Cette fonction encapsule la détection pour qu'on puisse migrer
// vers un champ explicite côté BE plus tard sans changer les call-sites.
const NOT_ENROLLED_SENTINELS = new Set(["", "—", "-", "null", "None"])

export function isEnrolledFromClassName(className: string | null | undefined): boolean {
  if (className === null || className === undefined) return false
  return !NOT_ENROLLED_SENTINELS.has(className.trim())
}

export interface EnrollmentSummary {
  total: number
  enrolled: number
  pending: number
}

export function summarizeEnrollment(
  children: ReadonlyArray<{ class_name: string | null | undefined }>,
): EnrollmentSummary {
  let enrolled = 0
  for (const child of children) {
    if (isEnrolledFromClassName(child.class_name)) enrolled += 1
  }
  return {
    total: children.length,
    enrolled,
    pending: children.length - enrolled,
  }
}
