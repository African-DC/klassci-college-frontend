"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { studentKeys } from "@/lib/hooks/useStudents"
import { photoOutcomeMessage, uploadStudentAvatar } from "@/lib/photo/uploadStudentAvatar"
import type { PhotoSaveOutcome } from "@/lib/photo/uploadStudentAvatar"

export function useAttachStudentPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studentId, photo }: { studentId?: number; photo: File | null }) =>
      uploadStudentAvatar(studentId, photo),
    onSuccess: async (outcome: PhotoSaveOutcome, variables) => {
      const message = photoOutcomeMessage(outcome)
      if (outcome === "saved") {
        await queryClient.invalidateQueries({ queryKey: studentKeys.all })
        if (variables.studentId) {
          await queryClient.invalidateQueries({ queryKey: studentKeys.detail(variables.studentId) })
        }
        if (message) toast.success(message)
      }
      if (outcome === "failed" && message) toast.error(message)
    },
  })
}
