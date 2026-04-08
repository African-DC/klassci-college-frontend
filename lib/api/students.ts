import { StudentSchema } from "@/lib/contracts/student"
import type { Student, StudentCreate, StudentUpdate } from "@/lib/contracts/student"
import { createCrudApi } from "./createCrudApi"

export const studentsApi = createCrudApi<Student, StudentCreate, StudentUpdate>(
  "/admin/students",
  StudentSchema,
)
