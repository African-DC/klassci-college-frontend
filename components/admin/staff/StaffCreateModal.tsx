"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StaffForm } from "@/components/forms/StaffForm"

interface StaffCreateModalProps {
  open: boolean
  onClose: () => void
}

export function StaffCreateModal({ open, onClose }: StaffCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau personnel</DialogTitle>
        </DialogHeader>
        <StaffForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  )
}
