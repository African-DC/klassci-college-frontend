import { getSession } from "next-auth/react"
import { z } from "zod"
import {
  DocumentTypeSchema,
  StudentDocumentSchema,
  type DocumentType,
  type StudentDocument,
} from "@/lib/contracts/student-attachment"
import { apiFetch, handleExpiredSession, safeValidate } from "./client"

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined")
  return url
}

const TypesArraySchema = z.array(DocumentTypeSchema)
const DocsArraySchema = z.array(StudentDocumentSchema)

export const studentAttachmentsApi = {
  listTypes: async (): Promise<DocumentType[]> => {
    const json = await apiFetch<unknown>("/admin/document-types")
    return safeValidate(TypesArraySchema, json, "GET /admin/document-types")
  },

  list: async (studentId: number): Promise<StudentDocument[]> => {
    const json = await apiFetch<unknown>(`/admin/students/${studentId}/documents`)
    return safeValidate(DocsArraySchema, json, `GET /admin/students/${studentId}/documents`)
  },

  upload: async (
    studentId: number,
    file: File,
    documentType: string,
  ): Promise<StudentDocument> => {
    const session = await getSession()
    if (session?.error === "RefreshTokenError") {
      void handleExpiredSession()
      throw new Error("Session expirée")
    }
    const formData = new FormData()
    formData.append("file", file)
    formData.append("document_type", documentType)
    const headers: Record<string, string> = session?.accessToken
      ? { Authorization: `Bearer ${session.accessToken}` }
      : {}
    const hadToken = "Authorization" in headers
    const res = await fetch(`${getBaseUrl()}/admin/students/${studentId}/documents`, {
      method: "POST",
      headers,
      body: formData,
    })
    if (res.status === 401) {
      if (hadToken) void handleExpiredSession()
      throw new Error("Session expirée")
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Échec de l'envoi" }))
      throw new Error(err.detail || "Échec de l'envoi du document")
    }
    const data = await res.json()
    return safeValidate(StudentDocumentSchema, data, "POST /admin/students/:id/documents")
  },

  remove: async (studentId: number, docId: number): Promise<void> => {
    await apiFetch<void>(`/admin/students/${studentId}/documents/${docId}`, { method: "DELETE" })
  },
}
