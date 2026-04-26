"use client"

import { CreateModal } from "@/components/shared/CreateModal"
import { StudentForm } from "@/components/forms/StudentForm"

interface StudentCreateModalProps {
  open: boolean
  onClose: () => void
}

export function StudentCreateModal({ open, onClose }: StudentCreateModalProps) {
  return (
    <CreateModal open={open} onClose={onClose} title="Nouvel élève">
      <StudentForm onSuccess={onClose} />
    </CreateModal>
  )
}
