"use client"

import { CreateModal } from "@/components/shared/CreateModal"
import { ClassForm } from "@/components/forms/ClassForm"

interface ClassCreateModalProps {
  open: boolean
  onClose: () => void
}

export function ClassCreateModal({ open, onClose }: ClassCreateModalProps) {
  return (
    <CreateModal open={open} onClose={onClose} title="Nouvelle classe">
      <ClassForm onSuccess={onClose} />
    </CreateModal>
  )
}
