"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { studentAttachmentsApi } from "@/lib/api/student-attachments"

export const attachmentKeys = {
  types: ["document-types"] as const,
  list: (studentId: number) => ["student-documents", studentId] as const,
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: attachmentKeys.types,
    queryFn: studentAttachmentsApi.listTypes,
    staleTime: 1000 * 60 * 10,
  })
}

export function useStudentDocuments(studentId: number | undefined) {
  return useQuery({
    queryKey: attachmentKeys.list(studentId as number),
    queryFn: () => studentAttachmentsApi.list(studentId as number),
    enabled: !!studentId,
  })
}

export function useUploadStudentDocument(studentId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType: string }) =>
      studentAttachmentsApi.upload(studentId, file, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.list(studentId) })
      queryClient.invalidateQueries({ queryKey: attachmentKeys.types })
      toast.success("Document ajouté")
    },
    onError: (err: Error) => toast.error("Erreur", { description: err.message }),
  })
}

export function useDeleteStudentDocument(studentId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (docId: number) => studentAttachmentsApi.remove(studentId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.list(studentId) })
      toast.success("Document supprimé")
    },
    onError: (err: Error) => toast.error("Erreur", { description: err.message }),
  })
}
