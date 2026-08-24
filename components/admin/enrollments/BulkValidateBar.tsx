"use client"

import { Button } from "@/components/ui/button"

interface BulkValidateBarProps {
  /** Combien de dossiers partiront réellement, affichés et cochés. */
  nombre: number
  enCours: boolean
  onValider: () => void
  onAnnuler: () => void
}

/**
 * La barre qui valide une sélection d'inscriptions.
 *
 * Elle ne s'affiche qu'une fois quelque chose de sélectionné : permanente,
 * elle occuperait la hauteur d'une ligne pour ne rien dire, sur un écran où
 * la liste est déjà longue.
 *
 * Le nombre vient de ce qui partira vraiment, pas du nombre de cases cochées.
 * Une ligne cochée puis passée à la page suivante, ou validée entre-temps par
 * un collègue, ne compte plus : annoncer trente et en valider vingt-huit
 * serait pire que de n'avoir rien annoncé.
 */
export function BulkValidateBar({ nombre, enCours, onValider, onAnnuler }: BulkValidateBarProps) {
  if (nombre === 0) return null

  return (
    <div className="hidden items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-2.5 md:flex">
      <p className="text-sm">
        <span className="font-semibold">{nombre}</span>{" "}
        {nombre === 1 ? "inscription sélectionnée" : "inscriptions sélectionnées"}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onAnnuler}>
          Annuler
        </Button>
        <Button size="sm" disabled={enCours} onClick={onValider}>
          {enCours ? "Validation…" : "Valider la sélection"}
        </Button>
      </div>
    </div>
  )
}
