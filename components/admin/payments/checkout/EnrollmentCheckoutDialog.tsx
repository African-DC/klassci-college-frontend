"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EnrollmentCheckout, type CheckoutTarget } from "./EnrollmentCheckout"

interface EnrollmentCheckoutDialogProps {
  /** L'inscription à encaisser ; `null` ferme la fenêtre. */
  target: CheckoutTarget | null
  onClose: () => void
}

/** L'encaissement d'une inscription connue, dans sa fenêtre. */
export function EnrollmentCheckoutDialog({ target, onClose }: EnrollmentCheckoutDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Encaisser un versement</DialogTitle>
        </DialogHeader>
        {target ? (
          // La clé remet l'encaissement à zéro quand on change d'inscription :
          // un écran de reçu ne doit jamais survivre à la famille suivante.
          <EnrollmentCheckout key={target.enrollmentId} {...target} onDone={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
