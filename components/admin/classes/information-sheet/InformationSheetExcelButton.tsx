"use client"

import { useState } from "react"
import { FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { informationSheetApi } from "@/lib/api/information-sheet"
import { exportToExcel } from "@/lib/export/excel"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useSettings } from "@/lib/hooks/useSettings"
import { buildInformationSheetPayload, informationSheetFileName } from "./information-sheet-export"

interface InformationSheetExcelButtonProps {
  classId: number
  className: string
  buttonClassName?: string
}

/**
 * La fiche de renseignements de la classe, en Excel, prête pour la comptabilité.
 *
 * Seize colonnes dans l'ordre du modèle officiel ; ce que l'école n'a pas
 * encore saisi sort en cellule vide, à compléter à la main.
 */
export function InformationSheetExcelButton({
  classId,
  className,
  buttonClassName,
}: InformationSheetExcelButtonProps) {
  const { data: settings } = useSettings()
  const [enCours, setEnCours] = useState(false)
  // Le serveur exige `enrollments:read` : sans lui, pas de bouton qui mène à un refus.
  const { has } = usePermissions()

  async function exporter() {
    setEnCours(true)
    const toastId = toast.loading("Préparation de la fiche de renseignements…")
    try {
      const sheet = await informationSheetApi.forClass(classId)
      const classe = sheet.classes[0]
      if (!classe) throw new Error("Cette classe n'a renvoyé aucune ligne.")
      const year = sheet.academic_year.name
      await exportToExcel(
        buildInformationSheetPayload(classe, year, settings),
        informationSheetFileName([classe.name, year]),
      )
      const n = classe.rows.length
      toast.success(`Fiche prête : ${n} élève${n > 1 ? "s" : ""}`, { id: toastId })
    } catch (err) {
      toast.error("Impossible de générer la fiche de renseignements", {
        id: toastId,
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
      })
    } finally {
      setEnCours(false)
    }
  }

  if (!has("enrollments:read")) return null

  return (
    <Button
      type="button"
      variant="outline"
      onClick={exporter}
      disabled={enCours}
      aria-label={`Télécharger la fiche de renseignements de la classe ${className} en Excel`}
      className={cn("h-11 w-full sm:h-10 sm:w-auto", buttonClassName)}
    >
      {enCours ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" />
      )}
      Fiche de renseignements
    </Button>
  )
}
