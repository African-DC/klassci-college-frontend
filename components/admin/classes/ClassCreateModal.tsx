"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClassForm } from "@/components/forms/ClassForm"

interface ClassCreateModalProps {
  open: boolean
  onClose: () => void
}

export function ClassCreateModal({ open, onClose }: ClassCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle classe</DialogTitle>
        </DialogHeader>
        <ClassForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  )
}
