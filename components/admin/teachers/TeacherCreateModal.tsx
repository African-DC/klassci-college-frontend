"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TeacherForm } from "@/components/forms/TeacherForm"

interface TeacherCreateModalProps {
  open: boolean
  onClose: () => void
}

export function TeacherCreateModal({ open, onClose }: TeacherCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Nouvel enseignant</DialogTitle>
        </DialogHeader>
        <TeacherForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  )
}
