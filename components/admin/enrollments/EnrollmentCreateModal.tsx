"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EnrollmentForm } from "@/components/forms/EnrollmentForm"

interface EnrollmentCreateModalProps {
  open: boolean
  onClose: () => void
}

export function EnrollmentCreateModal({ open, onClose }: EnrollmentCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Nouvelle inscription</DialogTitle>
        </DialogHeader>
        <EnrollmentForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  )
}
