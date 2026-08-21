"use client"

import { CreateModal } from "@/components/shared/CreateModal"
import { EnrollmentForm } from "@/components/forms/EnrollmentForm"

interface EnrollmentCreateModalProps {
  open: boolean
  onClose: () => void
  /** Pré-sélectionne un élève (depuis badge "À inscrire" sur la liste étudiants). */
  preselectedStudentId?: number
}

export function EnrollmentCreateModal({ open, onClose, preselectedStudentId }: EnrollmentCreateModalProps) {
  return (
    <CreateModal
      open={open}
      onClose={onClose}
      title="Nouvelle inscription"
      persistOnOutsideClick
      // Formulaire complexe en 4 étapes : taille XL sur grand écran.
      // En max-w-2xl la grille à deux colonnes était trop serrée et les
      // récapitulatifs de l’étape Résumé débordaient en largeur.
      className="flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-4xl flex-col gap-4 overflow-y-auto p-4 sm:p-6"
    >
      <EnrollmentForm onSuccess={onClose} preselectedStudentId={preselectedStudentId} />
    </CreateModal>
  )
}
