"use client"

import { CreateModal } from "@/components/shared/CreateModal"
import { EnrollmentForm } from "@/components/forms/EnrollmentForm"

interface EnrollmentCreateModalProps {
  open: boolean
  onClose: () => void
}

export function EnrollmentCreateModal({ open, onClose }: EnrollmentCreateModalProps) {
  return (
    <CreateModal open={open} onClose={onClose} title="Nouvelle inscription" className="max-w-2xl">
      <EnrollmentForm onSuccess={onClose} />
    </CreateModal>
  )
}
