"use client"

import { CreateModal } from "@/components/shared/CreateModal"
import { LevelForm } from "@/components/forms/LevelForm"

interface LevelCreateModalProps {
  open: boolean
  onClose: () => void
}

export function LevelCreateModal({ open, onClose }: LevelCreateModalProps) {
  return (
    <CreateModal open={open} onClose={onClose} title="Nouveau niveau">
      <LevelForm onSuccess={onClose} />
    </CreateModal>
  )
}
