import { getSession } from "next-auth/react"
import { StudentFiltersSchema, StudentSchema } from "@/lib/contracts/student"
import type { Student, StudentCreate, StudentFilters, StudentUpdate } from "@/lib/contracts/student"
import { createCrudApi } from "./createCrudApi"

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined")
  return url
}

export const studentsApi = {
  ...createCrudApi<Student, StudentCreate, StudentUpdate>(
    "/admin/students",
    StudentSchema,
  ),

  uploadPhoto: async (studentId: number, file: File): Promise<{ photo_url: string }> => {
    const session = await getSession()
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch(`${getBaseUrl()}/admin/students/${studentId}/photo`, {
      method: "POST",
      headers: {
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
      body: formData,
    })
    if (!res.ok) throw new Error("Upload failed")
    return res.json()
  },

  deletePhoto: async (studentId: number): Promise<void> => {
    const session = await getSession()
    const res = await fetch(`${getBaseUrl()}/admin/students/${studentId}/photo`, {
      method: "DELETE",
      headers: {
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
    })
    if (!res.ok) throw new Error("Erreur lors de la suppression de la photo")
  },

  getFilters: async (): Promise<StudentFilters> => {
    const session = await getSession()
    const res = await fetch(`${getBaseUrl()}/admin/students/filters`, {
      headers: {
        "Content-Type": "application/json",
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Impossible de charger les filtres")
    }
    const data = await res.json()
    return StudentFiltersSchema.parse(data)
  },

  getEnrollmentFees: async (studentId: number): Promise<StudentEnrollmentFee[]> => {
    const session = await getSession()
    const res = await fetch(`${getBaseUrl()}/admin/students/${studentId}/fees`, {
      headers: {
        "Content-Type": "application/json",
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Impossible de charger les frais")
    }
    const data = await res.json()
    return Array.isArray(data) ? data : data.items ?? data.data ?? []
  },
}

export interface StudentEnrollmentFee {
  id: number
  enrollment_id: number
  category_name: string
  amount: number
  paid: number
  remaining: number
  status: string
}
