"use client"

import { CreateModal } from "@/components/shared/CreateModal"
import { SeriesForm } from "@/components/forms/SeriesForm"

interface SeriesCreateModalProps {
  open: boolean
  onClose: () => void
  defaultLevelId?: number
}

export function SeriesCreateModal({ open, onClose, defaultLevelId }: SeriesCreateModalProps) {
  return (
    <CreateModal open={open} onClose={onClose} title="Nouvelle série">
      <SeriesForm onSuccess={onClose} defaultLevelId={defaultLevelId} />
    </CreateModal>
  )
}
