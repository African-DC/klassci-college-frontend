import { z } from "zod"

export const RoomSchema = z.object({
  id: z.number(),
  name: z.string(),
  capacity: z.number().nullable(),
  room_type: z.string(),
  class_name: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

export const RoomCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  capacity: z.number().int().positive("La capacité doit être positive").nullable().optional(),
  room_type: z.string().default("classroom"),
})

export const RoomUpdateSchema = RoomCreateSchema.partial()

export type Room = z.infer<typeof RoomSchema>
export type RoomCreate = z.infer<typeof RoomCreateSchema>
export type RoomUpdate = z.infer<typeof RoomUpdateSchema>

export const ROOM_TYPES = [
  { value: "classroom", label: "Salle de classe" },
  { value: "laboratory", label: "Laboratoire" },
  { value: "computer_room", label: "Salle informatique" },
  { value: "library", label: "Bibliothèque" },
  { value: "other", label: "Autre" },
] as const
