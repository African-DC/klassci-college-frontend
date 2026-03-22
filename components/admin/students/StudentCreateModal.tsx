"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StudentForm } from "@/components/forms/StudentForm"

interface StudentCreateModalProps {
  open: boolean
  onClose: () => void
}

export function StudentCreateModal({ open, onClose }: StudentCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvel eleve</DialogTitle>
        </DialogHeader>
        <StudentForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  )
}
