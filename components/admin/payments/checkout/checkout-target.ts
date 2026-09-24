import type { Enrollment } from "@/lib/contracts/enrollment"
import type { CheckoutTarget } from "./EnrollmentCheckout"

/** L'inscription à encaisser, telle que la fenêtre d'encaissement l'affiche. */
export function checkoutTarget(enrollment: Enrollment): CheckoutTarget {
  const studentName =
    [enrollment.student_last_name, enrollment.student_first_name].filter(Boolean).join(" ") ||
    `Élève #${enrollment.student_id}`
  return {
    enrollmentId: enrollment.id,
    studentName,
    contexte: checkoutContexte(enrollment),
  }
}

/** « 6e B · 2025-2026 » : de quoi reconnaître l'inscription d'un coup d'œil. */
export function checkoutContexte(enrollment: Enrollment): string {
  return [enrollment.class_name ?? `Classe #${enrollment.class_id}`, enrollment.academic_year_name]
    .filter(Boolean)
    .join(" · ")
}
