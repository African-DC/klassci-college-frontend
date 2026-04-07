"use client"

import { CreateModal } from "@/components/shared/CreateModal"
import { AcademicYearForm } from "./AcademicYearForm"

interface AcademicYearCreateModalProps {
  open: boolean
  onClose: () => void
}

export function AcademicYearCreateModal({ open, onClose }: AcademicYearCreateModalProps) {
  return (
    <CreateModal open={open} onClose={onClose} title="Nouvelle annee academique">
      <AcademicYearForm onSuccess={onClose} />
    </CreateModal>
  )
}
