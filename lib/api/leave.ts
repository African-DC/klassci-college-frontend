import { z } from "zod"
import { LeaveRequestSchema, type LeaveRequest, type LeaveCreate } from "@/lib/contracts/leave"
import { apiFetch, safeValidate } from "./client"

const LeaveArraySchema = z.array(LeaveRequestSchema)

export const leaveApi = {
  myRequests: async (): Promise<LeaveRequest[]> => {
    const json = await apiFetch<unknown>("/leave/requests/me")
    return safeValidate(LeaveArraySchema, json, "GET /leave/requests/me")
  },

  create: async (data: LeaveCreate): Promise<LeaveRequest> => {
    const json = await apiFetch<unknown>("/leave/requests", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return safeValidate(LeaveRequestSchema, json, "POST /leave/requests")
  },

  cancel: async (id: number): Promise<LeaveRequest> => {
    const json = await apiFetch<unknown>(`/leave/requests/${id}/cancel`, { method: "POST" })
    return safeValidate(LeaveRequestSchema, json, "POST /leave/requests/:id/cancel")
  },

  all: async (status?: string): Promise<LeaveRequest[]> => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : ""
    const json = await apiFetch<unknown>(`/admin/leave/requests${qs}`)
    return safeValidate(LeaveArraySchema, json, "GET /admin/leave/requests")
  },

  approve: async (id: number, comment?: string): Promise<LeaveRequest> => {
    const json = await apiFetch<unknown>(`/admin/leave/requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ comment: comment ?? null }),
    })
    return safeValidate(LeaveRequestSchema, json, "POST /admin/leave/requests/:id/approve")
  },

  reject: async (id: number, comment?: string): Promise<LeaveRequest> => {
    const json = await apiFetch<unknown>(`/admin/leave/requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ comment: comment ?? null }),
    })
    return safeValidate(LeaveRequestSchema, json, "POST /admin/leave/requests/:id/reject")
  },

  setInterim: async (id: number, teacherId: number | null): Promise<LeaveRequest> => {
    const json = await apiFetch<unknown>(`/admin/leave/requests/${id}/interim`, {
      method: "PATCH",
      body: JSON.stringify({ teacher_id: teacherId }),
    })
    return safeValidate(LeaveRequestSchema, json, "PATCH /admin/leave/requests/:id/interim")
  },
}
