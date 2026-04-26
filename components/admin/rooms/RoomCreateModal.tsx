"use client"

import { CreateModal } from "@/components/shared/CreateModal"
import { RoomForm } from "@/components/forms/RoomForm"

interface RoomCreateModalProps {
  open: boolean
  onClose: () => void
}

export function RoomCreateModal({ open, onClose }: RoomCreateModalProps) {
  return (
    <CreateModal open={open} onClose={onClose} title="Nouvelle salle">
      <RoomForm onSuccess={onClose} />
    </CreateModal>
  )
}
