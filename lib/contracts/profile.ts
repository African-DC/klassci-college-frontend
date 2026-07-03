import { z } from "zod"

// Miroir de app/schemas/profile.py::MyProfileResponse
export const MyProfileSchema = z.object({
  user_id: z.number(),
  email: z.string(),
  role: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullish(),
  photo_url: z.string().nullish(),
  position: z.string().nullish(),
  speciality: z.string().nullish(),
  can_edit_photo: z.boolean(),
  can_edit_phone: z.boolean(),
  last_login: z.string().nullish(),
  created_at: z.string().nullish(),
})

export const MyProfileUpdateSchema = z.object({
  phone: z.string().optional(),
})

export type MyProfile = z.infer<typeof MyProfileSchema>
export type MyProfileUpdate = z.infer<typeof MyProfileUpdateSchema>
