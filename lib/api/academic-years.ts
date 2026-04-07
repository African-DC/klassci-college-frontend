import { AcademicYearSchema } from "@/lib/contracts/academic-year"
import type { AcademicYear, AcademicYearCreate, AcademicYearUpdate } from "@/lib/contracts/academic-year"
import { createCrudApi } from "./createCrudApi"
import { apiFetch } from "./client"

export const academicYearsApi = {
  ...createCrudApi<AcademicYear, AcademicYearCreate, AcademicYearUpdate>(
    "/admin/academic-years",
    AcademicYearSchema,
  ),

  setAsCurrent: async (yearId: number): Promise<AcademicYear> => {
    return apiFetch<AcademicYear>(`/admin/academic-years/${yearId}/set-current`, {
      method: "PATCH",
    })
  },
}
