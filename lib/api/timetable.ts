const BASE_URL = process.env.NEXT_PUBLIC_API_URL

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
    const res = await fetch(`${BASE_URL}/timetable?class_id=${classId}`, {
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors du chargement")
    }
    const json = await res.json()
    return json.data ?? json
  },

  listByTeacher: async (teacherId: number): Promise<TimetableSlot[]> => {
    const res = await fetch(`${BASE_URL}/timetable?teacher_id=${teacherId}`, {
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors du chargement")
    }
    const json = await res.json()
    return json.data ?? json
  },

  create: async (data: TimetableSlotCreateBody): Promise<TimetableSlot> => {
    const res = await fetch(`${BASE_URL}/timetable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors de la creation")
    }
    const json = await res.json()
    return json.data ?? json
  },

  update: async (id: number, data: TimetableSlotUpdateBody): Promise<TimetableSlot> => {
    const res = await fetch(`${BASE_URL}/timetable/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors de la mise a jour")
    }
    const json = await res.json()
    return json.data ?? json
  },

  remove: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/timetable/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors de la suppression")
    }
  },

  generate: async (classId: number): Promise<GenerateTaskResponse> => {
    const res = await fetch(`${BASE_URL}/timetable/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_id: classId }),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors de la generation")
    }
    return res.json()
  },

  taskStatus: async (taskId: string): Promise<GenerateTaskResponse> => {
    const res = await fetch(`${BASE_URL}/timetable/tasks/${taskId}`, {
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      throw new Error("Erreur lors de la verification du statut")
    }
    return res.json()
  },
}
