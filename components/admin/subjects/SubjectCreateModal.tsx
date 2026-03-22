"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SubjectForm } from "@/components/forms/SubjectForm"

interface SubjectCreateModalProps {
  open: boolean
  onClose: () => void
}

export function SubjectCreateModal({ open, onClose }: SubjectCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle matiere</DialogTitle>
        </DialogHeader>
        <SubjectForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  )
}
