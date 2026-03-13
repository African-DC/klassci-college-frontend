import { z } from "zod"

// Miroir de app/schemas/teacher.py (backend)
// TODO: completer quand l'endpoint GET /teachers est disponible

export const TeacherSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  subject_ids: z.array(z.number()),
})

export type Teacher = z.infer<typeof TeacherSchema>
