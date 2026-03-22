import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  StaffSchema,
  type Staff,
  type StaffCreate,
  type StaffUpdate,
  type StaffListParams,
} from "@/lib/contracts/staff"
import { PaginatedResponseSchema, type PaginatedResponse } from "@/lib/contracts"

const PaginatedStaff = PaginatedResponseSchema(StaffSchema)
const StaffArraySchema = z.array(StaffSchema)

export type { Staff, StaffCreate, StaffUpdate, StaffListParams }
export type { PaginatedResponse }

export const staffApi = {
  list: async (params: StaffListParams = {}): Promise<PaginatedResponse<Staff>> => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        query.set(key, String(value))
      }
    })
    const json = await apiFetch<PaginatedResponse<Staff> | Staff[]>(
      `/staff?${query.toString()}`,
    )
    if (Array.isArray(json)) {
      const data = safeValidate(StaffArraySchema, json, "/staff")
      return { data, total: data.length, page: 1, per_page: data.length, total_pages: 1 }
    }
    return safeValidate(PaginatedStaff, json, "/staff")
  },

  getById: async (id: number): Promise<Staff> => {
    const res = await apiFetch<{ data?: Staff }>(`/staff/${id}`)
    const item = (res as { data?: Staff }).data ?? (res as unknown as Staff)
    return safeValidate(StaffSchema, item, `/staff/${id}`)
  },

  create: async (data: StaffCreate): Promise<Staff> => {
    const res = await apiFetch<{ data?: Staff }>("/staff", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const item = (res as { data?: Staff }).data ?? (res as unknown as Staff)
    return safeValidate(StaffSchema, item, "POST /staff")
  },

  update: async (id: number, data: StaffUpdate): Promise<Staff> => {
    const res = await apiFetch<{ data?: Staff }>(`/staff/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    const item = (res as { data?: Staff }).data ?? (res as unknown as Staff)
    return safeValidate(StaffSchema, item, `PATCH /staff/${id}`)
  },

  remove: async (id: number): Promise<void> => {
    await apiFetch(`/staff/${id}`, { method: "DELETE" })
  },
}
