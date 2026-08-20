"use client"

import { CreateModal } from "@/components/shared/CreateModal"
import { EnrollmentForm } from "@/components/forms/EnrollmentForm"

interface EnrollmentCreateModalProps {
  open: boolean
  onClose: () => void
  /** Pré-sélectionne un élève (depuis badge "À inscrire" sur la liste étudiants). */
  preselectedStudentId?: number
}

export function EnrollmentCreateModal({ open, onClose, preselectedStudentId }: EnrollmentCreateModalProps) {
  return (
    <CreateModal
      open={open}
      onClose={onClose}
      title="Nouvelle inscription"
      persistOnOutsideClick
      className="flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-4 overflow-y-auto p-4 sm:p-6"
    >
      <EnrollmentForm onSuccess={onClose} preselectedStudentId={preselectedStudentId} />
    </CreateModal>
  )
}
