"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PaymentReceiptDialogProps {
  /** L'URL objet du PDF déjà téléchargé ; `null` ferme la fenêtre. */
  url: string | null
  paymentId: number | null
  onClose: () => void
  onDownload: () => void
}

/**
 * L'aperçu d'un reçu avant impression.
 *
 * On montre le PDF plutôt que de le télécharger d'emblée : au guichet, on
 * vérifie le montant et le nom à l'écran avant d'engager le papier, qui est
 * une ressource comptée dans une école.
 */
export function PaymentReceiptDialog({
  url,
  paymentId,
  onClose,
  onDownload,
}: PaymentReceiptDialogProps) {
  return (
    <Dialog open={url !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Reçu de paiement #{paymentId}</DialogTitle>
        </DialogHeader>
        {url && (
          <iframe src={url} className="h-[65vh] w-full rounded-lg border" title="Aperçu du reçu" />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Télécharger le PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
