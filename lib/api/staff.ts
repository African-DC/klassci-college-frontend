import { StaffSchema } from "@/lib/contracts/staff"
import type { Staff, StaffCreate, StaffUpdate } from "@/lib/contracts/staff"
import { createCrudApi } from "./createCrudApi"

export const staffApi = createCrudApi<Staff, StaffCreate, StaffUpdate>(
  "/staff",
  StaffSchema,
)
