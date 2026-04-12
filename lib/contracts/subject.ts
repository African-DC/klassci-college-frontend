import { z } from "zod"

export const SubjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  level_id: z.number().nullable(),
  series_id: z.number().nullable(),
  coefficient: z.number(),
  hours_per_week: z.number(),
  color: z.string().nullable().optional(),
  level_name: z.string().nullable().optional(),
  series_name: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

export const SubjectCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  coefficient: z.number({ required_error: "Le coefficient est requis" }).positive("Le coefficient doit être positif"),
  hours_per_week: z.number({ required_error: "Les heures par semaine sont requises" }).positive("Les heures doivent être positives"),
  level_id: z.number().nullable().optional(),
  series_id: z.number().nullable().optional(),
  color: z.string().nullable().optional(),
})

export const SubjectUpdateSchema = SubjectCreateSchema.partial()

export type Subject = z.infer<typeof SubjectSchema>
export type SubjectCreate = z.infer<typeof SubjectCreateSchema>
export type SubjectUpdate = z.infer<typeof SubjectUpdateSchema>

export const SUBJECT_COLOR_PALETTE = [
  { value: "blue", label: "Bleu", class: "bg-blue-500" },
  { value: "emerald", label: "Vert", class: "bg-emerald-500" },
  { value: "amber", label: "Ambre", class: "bg-amber-500" },
  { value: "violet", label: "Violet", class: "bg-violet-500" },
  { value: "rose", label: "Rose", class: "bg-rose-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
  { value: "red", label: "Rouge", class: "bg-red-500" },
  { value: "green", label: "Vert foncé", class: "bg-green-600" },
  { value: "pink", label: "Rose vif", class: "bg-pink-500" },
] as const
