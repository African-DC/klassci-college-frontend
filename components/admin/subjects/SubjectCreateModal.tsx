"use client"

import { CreateModal } from "@/components/shared/CreateModal"
import { SubjectForm } from "@/components/forms/SubjectForm"

interface SubjectCreateModalProps {
  open: boolean
  onClose: () => void
}

export function SubjectCreateModal({ open, onClose }: SubjectCreateModalProps) {
  return (
    <CreateModal open={open} onClose={onClose} title="Nouvelle matière">
      <SubjectForm onSuccess={onClose} />
    </CreateModal>
  )
}
