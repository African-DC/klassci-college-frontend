import { z } from "zod"
import {
  DocumentTypeSchema,
  StudentDocumentSchema,
  type DocumentType,
  type StudentDocument,
} from "@/lib/contracts/student-attachment"
import { apiFetch, apiFetchMultipart, safeValidate } from "./client"

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
    const formData = new FormData()
    formData.append("file", file)
    formData.append("document_type", documentType)
    return apiFetchMultipart(`/admin/students/${studentId}/documents`, formData, {
      schema: StudentDocumentSchema,
      context: "POST /admin/students/:id/documents",
      fallback: "Échec de l'envoi du document",
    })
  },

  remove: async (studentId: number, docId: number): Promise<void> => {
    await apiFetch<void>(`/admin/students/${studentId}/documents/${docId}`, { method: "DELETE" })
  },
}
