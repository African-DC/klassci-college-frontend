"use client"

import { CreateModal } from "@/components/shared/CreateModal"
import { TeacherForm } from "@/components/forms/TeacherForm"

interface TeacherCreateModalProps {
  open: boolean
  onClose: () => void
}

export function TeacherCreateModal({ open, onClose }: TeacherCreateModalProps) {
  return (
    <CreateModal open={open} onClose={onClose} title="Nouvel enseignant">
      <TeacherForm onSuccess={onClose} />
    </CreateModal>
  )
}
