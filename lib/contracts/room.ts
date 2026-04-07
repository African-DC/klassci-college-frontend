import { z } from "zod"

export const RoomSchema = z.object({
  id: z.number(),
  name: z.string(),
  capacity: z.number().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

export const RoomCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  capacity: z.number().int().positive("La capacité doit être positive").nullable().optional(),
})

export const RoomUpdateSchema = RoomCreateSchema.partial()

export type Room = z.infer<typeof RoomSchema>
export type RoomCreate = z.infer<typeof RoomCreateSchema>
export type RoomUpdate = z.infer<typeof RoomUpdateSchema>
