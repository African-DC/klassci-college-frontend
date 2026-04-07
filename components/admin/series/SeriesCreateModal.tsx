"use client"

import { CreateModal } from "@/components/shared/CreateModal"
import { SeriesForm } from "@/components/forms/SeriesForm"

interface SeriesCreateModalProps {
  open: boolean
  onClose: () => void
}

export function SeriesCreateModal({ open, onClose }: SeriesCreateModalProps) {
  return (
    <CreateModal open={open} onClose={onClose} title="Nouvelle serie">
      <SeriesForm onSuccess={onClose} />
    </CreateModal>
  )
}
