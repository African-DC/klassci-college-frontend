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
    <CreateModal open={open} onClose={onClose} title="Nouvelle inscription" className="max-w-2xl">
      <EnrollmentForm onSuccess={onClose} preselectedStudentId={preselectedStudentId} />
    </CreateModal>
  )
}
