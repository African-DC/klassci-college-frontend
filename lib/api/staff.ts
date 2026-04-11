import { StaffSchema } from "@/lib/contracts/staff"
import type { Staff, StaffCreate, StaffUpdate } from "@/lib/contracts/staff"
import { createCrudApi } from "./createCrudApi"
import { apiFetch } from "./client"

export const staffApi = {
  ...createCrudApi<Staff, StaffCreate, StaffUpdate>(
    "/admin/staff",
    StaffSchema,
  ),

  getFull: async (id: number): Promise<Record<string, unknown>> => {
    return apiFetch<Record<string, unknown>>(`/admin/staff/${id}/full`)
  },
}
