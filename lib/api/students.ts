import { getSession } from "next-auth/react"
import { StudentSchema } from "@/lib/contracts/student"
import type { Student, StudentCreate, StudentUpdate } from "@/lib/contracts/student"
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
}
