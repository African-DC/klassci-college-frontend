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

interface Props {
  open: boolean
  slots: number
  onCancel: () => void
  onConfirm: () => void
}

/** Confirmation avant de retirer un enseignant qui a déjà des créneaux dans l'emploi du temps. */
export function SubjectTeacherRemovalDialog({ open, slots, onCancel, onConfirm }: Props) {
  const unit = slots > 1 ? "créneaux" : "créneau"
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!next) onCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retirer des enseignants ?</AlertDialogTitle>
          <AlertDialogDescription>
            Ces enseignants ont déjà {slots} {unit} dans l’emploi du temps pour cette matière.
            Les créneaux existants ne seront pas supprimés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">Annuler</AlertDialogCancel>
          <AlertDialogAction className="h-11" onClick={onConfirm}>Confirmer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
