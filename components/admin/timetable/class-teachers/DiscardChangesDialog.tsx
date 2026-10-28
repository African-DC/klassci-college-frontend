"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DiscardChangesDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DiscardChangesDialog({ open, onConfirm, onCancel }: DiscardChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Abandonner les modifications ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les enseignants choisis ne seront pas enregistrés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 sm:h-10">Continuer la saisie</AlertDialogCancel>
          <AlertDialogAction className="h-11 sm:h-10" onClick={onConfirm}>
            Abandonner
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
