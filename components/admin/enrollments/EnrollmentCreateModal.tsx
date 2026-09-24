"use client"

import { useState } from "react"
import { CreateModal } from "@/components/shared/CreateModal"
import { EnrollmentForm } from "@/components/forms/EnrollmentForm"
import { EnrollmentCheckout } from "@/components/admin/payments/checkout/EnrollmentCheckout"
import { checkoutTarget } from "@/components/admin/payments/checkout/checkout-target"
import type { Enrollment } from "@/lib/contracts/enrollment"

interface EnrollmentCreateModalProps {
  open: boolean
  onClose: () => void
  /** Pré-sélectionne un élève (depuis badge "À inscrire" sur la liste étudiants). */
  preselectedStudentId?: number
}

/**
 * Inscrire, puis encaisser, sans quitter la fenêtre.
 *
 * La fenêtre se refermait dès l'inscription enregistrée. Il fallait alors
 * retrouver la ligne, ouvrir la caisse, rechercher l'élève qu'on venait de
 * saisir et choisir l'inscription qu'on venait de créer. Elle enchaîne
 * désormais sur l'encaissement de CETTE inscription, puis sur le reçu et la
 * validation. « Encaisser plus tard » reste possible : une famille ne paie pas
 * toujours le jour où elle inscrit.
 */
export function EnrollmentCreateModal({
  open,
  onClose,
  preselectedStudentId,
}: EnrollmentCreateModalProps) {
  const [creee, setCreee] = useState<Enrollment | null>(null)

  function fermer() {
    setCreee(null)
    onClose()
  }

  return (
    <CreateModal
      open={open}
      onClose={fermer}
      title={creee ? "Inscription enregistrée · premier versement" : "Nouvelle inscription"}
      persistOnOutsideClick
      // Formulaire complexe en 4 étapes : taille XL sur grand écran.
      // En max-w-2xl la grille à deux colonnes était trop serrée et les
      // récapitulatifs de l’étape Résumé débordaient en largeur.
      className="flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-4xl flex-col gap-4 overflow-y-auto p-4 sm:p-6"
    >
      {creee ? (
        <div className="mx-auto w-full max-w-2xl">
          <EnrollmentCheckout
            {...checkoutTarget(creee)}
            onDone={fermer}
            laterLabel="Encaisser plus tard"
          />
        </div>
      ) : (
        <EnrollmentForm onSuccess={setCreee} preselectedStudentId={preselectedStudentId} />
      )}
    </CreateModal>
  )
}
