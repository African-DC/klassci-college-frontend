"use client"

import { useState } from "react"
import { FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fileSafeName, fetchClassRosterExcel, triggerBlobDownload } from "./class-downloads"
import type { RosterFilters } from "./roster-filters"

interface ClassRosterExcelButtonProps {
  classId: number
  className: string
  filters?: RosterFilters
  /** Classes du bouton, pour s'aligner sur les boutons PDF voisins. */
  buttonClassName?: string
}

/**
 * La liste de classe en Excel, là où on la cherche : sur la fiche de la classe.
 *
 * Elle n'existait qu'en PDF ici ; l'Excel ne se trouvait que depuis la liste
 * des élèves filtrée par classe. Même chargement (tous les élèves, page après
 * page) et même identité (logo, en-tête officiel) que cet export-là : deux
 * chemins, un seul fichier.
 */
export function ClassRosterExcelButton({
  classId,
  className,
  filters = {},
  buttonClassName,
}: ClassRosterExcelButtonProps) {
  const [enCours, setEnCours] = useState(false)

  async function exporter() {
    setEnCours(true)
    const toastId = toast.loading("Préparation de la liste…")
    try {
      const blob = await fetchClassRosterExcel(classId, filters)
      triggerBlobDownload(blob, `liste-classe-${fileSafeName(className)}.xlsx`)
      toast.success("Liste Excel téléchargée", { id: toastId })
    } catch (err) {
      toast.error("Impossible de générer la liste Excel", {
        id: toastId,
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
      })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={exporter}
      disabled={enCours}
      aria-label={`Télécharger la liste de la classe ${className} en Excel`}
      className={cn("h-11 w-full sm:h-10 sm:w-auto", buttonClassName)}
    >
      {enCours ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" />
      )}
      Excel
    </Button>
  )
}
