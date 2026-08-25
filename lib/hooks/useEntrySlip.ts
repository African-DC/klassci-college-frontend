"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { schoolLifeDocumentsApi } from "@/lib/api/school-life-documents"
import { fileSafeName } from "@/components/admin/classes/detail/class-downloads"
import { downloadBlob } from "@/lib/utils"
import { attendanceKeys } from "./useAttendance"
import type { EntrySlipRequest } from "@/lib/contracts/school-life"

interface IssueEntrySlipVariables {
  recordId: number
  payload: EntrySlipRequest
  /** Sert à nommer le fichier téléchargé, ex. « TRAORE_Aminata ». */
  studentLabel?: string
}

/**
 * Délivre un billet d'entrée : le POST ferme l'absence dans le cahier d'appel
 * puis rend le PDF. Les présences affichées à l'écran deviennent fausses à cet
 * instant précis, donc tout le cache `attendance` est invalidé au succès.
 */
export function useIssueEntrySlip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ recordId, payload, studentLabel }: IssueEntrySlipVariables) => {
      const blob = await schoolLifeDocumentsApi.issueEntrySlip(recordId, payload)
      downloadBlob(blob, `billet-entree-${fileSafeName(studentLabel ?? `appel ${recordId}`)}.pdf`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
      toast.success("Billet d'entrée délivré", {
        description: "L'absence est régularisée dans le cahier d'appel.",
      })
    },
    onError: (err: Error) =>
      toast.error("Billet d'entrée impossible", { description: err.message }),
  })
}
