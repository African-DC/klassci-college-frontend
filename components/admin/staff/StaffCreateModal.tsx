"use client"

import { CreateModal } from "@/components/shared/CreateModal"
import { StaffForm } from "@/components/forms/StaffForm"

interface StaffCreateModalProps {
  open: boolean
  onClose: () => void
}

export function StaffCreateModal({ open, onClose }: StaffCreateModalProps) {
  return (
    <CreateModal open={open} onClose={onClose} title="Nouveau personnel">
      <StaffForm onSuccess={onClose} />
    </CreateModal>
  )
}
