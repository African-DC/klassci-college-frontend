"use client"

import type { ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
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
import { cn } from "@/lib/utils"

export interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /**
   * Ce qui va réellement se passer, à la place de « Êtes-vous sûr ? » : la
   * question n'apprend rien à personne, la conséquence si.
   */
  description: string
  /** Le détail qu'une phrase ne porte pas : lignes conservées, article visé. */
  details?: ReactNode
  confirmLabel: string
  pendingLabel: string
  cancelLabel?: string
  pending?: boolean
  /** Quand la boîte demande un choix et qu'il n'y a encore rien à valider. */
  confirmDisabled?: boolean
  /**
   * `warning` pour une action qui réécrit ou solde des lignes existantes. Le
   * ton se lit au pictogramme et au libellé du bouton autant qu'à la couleur :
   * sur un écran d'entrée de gamme en plein soleil, la couleur seule ne se voit
   * pas, et un daltonien ne la lit pas du tout.
   */
  tone?: "default" | "warning"
  onConfirm: () => void
}

/**
 * La confirmation partagée des actions qui changent l'argent dû.
 *
 * Une seule forme pour « Régénérer les frais » et « Marquer déposé » : mêmes
 * cibles, même place des boutons, même façon de dire la conséquence. La
 * hauteur et le défilement viennent de `AlertDialogContent`, qui les pose déjà
 * en `dvh` : les surcharger ici ferait sortir le bouton de confirmation de
 * l'écran sur un téléphone de 5,5 pouces.
 */
export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  details,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Retour",
  pending = false,
  confirmDisabled = false,
  tone = "default",
  onConfirm,
}: ConfirmActionDialogProps) {
  const warning = tone === "warning"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-start gap-2 text-left">
            {warning ? (
              <AlertTriangle
                aria-hidden
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
              />
            ) : null}
            <span className="min-w-0 break-words">{title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {details ? (
          <div className="min-w-0 space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed break-words">
            {details}
          </div>
        ) : null}

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="h-11 w-full sm:h-10 sm:w-auto" disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              "h-11 w-full sm:h-10 sm:w-auto",
              warning && "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-600",
            )}
            disabled={pending || confirmDisabled}
            onClick={(event) => {
              // Radix ferme la boîte au clic : on garde la main pour n'annoncer
              // la fermeture qu'une fois l'appel parti, sinon le libellé
              // « en cours » disparaît avant même d'avoir été lu.
              event.preventDefault()
              onConfirm()
            }}
          >
            {pending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
