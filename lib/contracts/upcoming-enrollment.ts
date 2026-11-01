import { z } from "zod"

// Les frais d'une réinscription, présentés à part de l'année en cours.
export const UpcomingEnrollmentFeesSchema = z.object({
  academic_year_name: z.string(),
  class_name: z.string().nullish(),
  total_due: z.coerce.number(),
  total_paid: z.coerce.number(),
  remaining: z.coerce.number(),
})

export type UpcomingEnrollmentFees = z.infer<typeof UpcomingEnrollmentFeesSchema>
