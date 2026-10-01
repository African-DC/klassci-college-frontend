"use client"

import { useState } from "react"
import { FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { informationSheetApi } from "@/lib/api/information-sheet"
import { exportSheetsToExcel } from "@/lib/export/excel-sheets"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useSettings } from "@/lib/hooks/useSettings"
import { buildInformationSheetPayload, informationSheetFileName } from "./information-sheet-export"

/**
 * Toutes les classes de l'année dans un seul classeur, une feuille par classe.
 *
 * Rendu comme un bouton du hero de la liste des classes : la classe à passer
 * en `className` vient de l'écran qui l'accueille.
 */
export function AllClassesInformationSheetButton({ className }: { className?: string }) {
  const { data: settings } = useSettings()
  const [enCours, setEnCours] = useState(false)
  // Le serveur exige `enrollments:read` : sans lui, pas de bouton qui mène à un refus.
  const { has } = usePermissions()

  async function exporter() {
    setEnCours(true)
    const toastId = toast.loading("Préparation des fiches de toutes les classes…")
    try {
      const sheet = await informationSheetApi.forYear()
      if (sheet.classes.length === 0) {
        throw new Error("Aucune classe n'a d'inscription pour cette année.")
      }
      const year = sheet.academic_year.name
      await exportSheetsToExcel(
        sheet.classes.map((classe) => ({
          name: classe.name,
          payload: buildInformationSheetPayload(classe, year, settings),
        })),
        informationSheetFileName(["Toutes les classes", year]),
      )
      const n = sheet.classes.length
      toast.success(`Classeur prêt : ${n} classe${n > 1 ? "s" : ""}, une feuille chacune`, {
        id: toastId,
      })
    } catch (err) {
      toast.error("Impossible de générer les fiches de renseignements", {
        id: toastId,
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
      })
    } finally {
      setEnCours(false)
    }
  }

  if (!has("enrollments:read")) return null

  return (
    <button
      type="button"
      onClick={exporter}
      disabled={enCours}
      className={cn("disabled:cursor-not-allowed disabled:opacity-70", className)}
    >
      {enCours ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
      )}
      Fiches de renseignements
    </button>
  )
}
