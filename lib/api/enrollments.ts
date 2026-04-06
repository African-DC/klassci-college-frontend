import { EnrollmentSchema } from "@/lib/contracts/enrollment"
import type { Enrollment, EnrollmentCreate, EnrollmentUpdate } from "@/lib/contracts/enrollment"
import { createCrudApi } from "./createCrudApi"

export const enrollmentsApi = createCrudApi<Enrollment, EnrollmentCreate, EnrollmentUpdate>(
  "/enrollments",
  EnrollmentSchema,
)
