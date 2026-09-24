"use client"

import { useState } from "react"
import { FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { loadStudentsExportPayload } from "@/components/admin/students/students-export"
import { exportToExcel } from "@/lib/export/excel"
import { useSettings } from "@/lib/hooks/useSettings"
import { fileSafeName } from "./class-downloads"

interface ClassRosterExcelButtonProps {
  classId: number
  className: string
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
  buttonClassName,
}: ClassRosterExcelButtonProps) {
  const { data: settings } = useSettings()
  const [enCours, setEnCours] = useState(false)

  async function exporter() {
    setEnCours(true)
    const toastId = toast.loading("Préparation de la liste…")
    try {
      const payload = await loadStudentsExportPayload({
        params: { class_id: classId },
        settings,
        filters: `Classe ${className}`,
      })
      await exportToExcel(
        { ...payload, meta: { ...payload.meta, title: `Liste de classe · ${className}` } },
        `liste-classe-${fileSafeName(className)}`,
      )
      const n = payload.rows.length
      toast.success(`Liste Excel prête : ${n} élève${n > 1 ? "s" : ""}`, { id: toastId })
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
