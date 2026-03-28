import { TeacherSchema } from "@/lib/contracts/teacher"
import type { Teacher, TeacherCreate, TeacherUpdate } from "@/lib/contracts/teacher"
import { createCrudApi } from "./createCrudApi"

export const teachersApi = createCrudApi<Teacher, TeacherCreate, TeacherUpdate>(
  "/teachers",
  TeacherSchema,
)
