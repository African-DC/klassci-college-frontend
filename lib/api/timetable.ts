import { apiFetch } from "@/lib/api/client"

export interface TimetableSlot {
  id: number
  class_id: number
  class_name: string
  teacher_id: number
  teacher_name: string
  subject_id: number
  subject_name: string
  day: "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi"
  start_time: string
  end_time: string
  room?: string
}

export interface TimetableSlotCreateBody {
  class_id: number
  teacher_id: number
  subject_id: number
  day: string
  start_time: string
  end_time: string
  room?: string
}

export interface TimetableSlotUpdateBody {
  teacher_id?: number
  subject_id?: number
  day?: string
  start_time?: string
  end_time?: string
  room?: string
}

export interface GenerateTaskResponse {
  task_id: string
  status: "pending" | "running" | "completed" | "failed"
  message?: string
}

export const timetableApi = {
  listByClass: async (classId: number): Promise<TimetableSlot[]> => {
    const json = await apiFetch<{ data?: TimetableSlot[] } | TimetableSlot[]>(
      `/timetable?class_id=${classId}`,
    )
    return Array.isArray(json) ? json : json.data ?? []
  },

  listByTeacher: async (teacherId: number): Promise<TimetableSlot[]> => {
    const json = await apiFetch<{ data?: TimetableSlot[] } | TimetableSlot[]>(
      `/timetable?teacher_id=${teacherId}`,
    )
    return Array.isArray(json) ? json : json.data ?? []
  },

  create: async (data: TimetableSlotCreateBody): Promise<TimetableSlot> => {
    const json = await apiFetch<{ data?: TimetableSlot } | TimetableSlot>(
      `/timetable`,
      { method: "POST", body: JSON.stringify(data) },
    )
    return (json as { data?: TimetableSlot }).data ?? (json as TimetableSlot)
  },

  update: async (id: number, data: TimetableSlotUpdateBody): Promise<TimetableSlot> => {
    const json = await apiFetch<{ data?: TimetableSlot } | TimetableSlot>(
      `/timetable/${id}`,
      { method: "PATCH", body: JSON.stringify(data) },
    )
    return (json as { data?: TimetableSlot }).data ?? (json as TimetableSlot)
  },

  remove: async (id: number): Promise<void> => {
    await apiFetch<void>(`/timetable/${id}`, { method: "DELETE" })
  },

  generate: async (classId: number): Promise<GenerateTaskResponse> => {
    return apiFetch<GenerateTaskResponse>(`/timetable/generate`, {
      method: "POST",
      body: JSON.stringify({ class_id: classId }),
    })
  },

  taskStatus: async (taskId: string): Promise<GenerateTaskResponse> => {
    return apiFetch<GenerateTaskResponse>(`/timetable/tasks/${taskId}`)
  },
}
