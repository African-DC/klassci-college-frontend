import { z } from "zod"

export const evaluationCreateSchema = z.object({
  title: z.string({ required_error: "Le titre est requis" }).min(1, "Le titre est requis"),
  type: z.enum(["devoir", "interro", "examen", "composition"], {
    required_error: "Le type est requis",
  }),
  date: z.string({ required_error: "La date est requise" }).min(1, "La date est requise"),
  coefficient: z.number({ required_error: "Le coefficient est requis" }).positive("Le coefficient doit etre positif"),
  subject_id: z.number({ required_error: "La matiere est requise" }).positive(),
  class_id: z.number({ required_error: "La classe est requise" }).positive(),
})

export type EvaluationCreateInput = z.infer<typeof evaluationCreateSchema>
