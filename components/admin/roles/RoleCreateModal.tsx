"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RoleForm } from "@/components/forms/RoleForm"

interface RoleCreateModalProps {
  open: boolean
  onClose: () => void
}

export function RoleCreateModal({ open, onClose }: RoleCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Nouveau rôle</DialogTitle>
        </DialogHeader>
        <RoleForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  )
}
