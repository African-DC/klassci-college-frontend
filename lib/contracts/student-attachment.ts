import { z } from "zod"

export const DocumentTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export const StudentDocumentSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  document_type: z.string(),
  file_url: z.string(),
  file_name: z.string().nullish(),
  mime_type: z.string().nullish(),
  uploaded_by: z.number().nullish(),
  created_at: z.string(),
})

export type DocumentType = z.infer<typeof DocumentTypeSchema>
export type StudentDocument = z.infer<typeof StudentDocumentSchema>
