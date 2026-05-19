"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { promotionsApi } from "@/lib/api/promotions"
import type {
  PromotionExecuteRequest,
  PromotionPreviewRequest,
} from "@/lib/contracts/promotion"

/**
 * Mutation pre-flight de la promotion bulk. Ne modifie rien côté BE — c'est
 * juste un POST stateless qui retourne le summary. On utilise mutation plutôt
 * que query pour ne le déclencher que sur demande explicite (bouton « Aperçu »),
 * pas en auto-fetch.
 */
export function usePromotionPreview() {
  return useMutation({
    mutationFn: (data: PromotionPreviewRequest) => promotionsApi.preview(data),
    onError: (error: Error) => {
      toast.error("Aperçu impossible", { description: error.message })
    },
  })
}

/**
 * Mutation d'exécution de la promotion bulk. Invalide les enrollments queries
 * au succès (la queue cycle 1 doit refléter les nouveaux prospects).
 */
export function usePromotionExecute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PromotionExecuteRequest) => promotionsApi.execute(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      if (data.promoted_count > 0) {
        toast.success(
          `${data.promoted_count} inscription${data.promoted_count > 1 ? "s" : ""} promue${
            data.promoted_count > 1 ? "s" : ""
          }`,
          {
            description:
              data.error_count > 0
                ? `${data.error_count} erreur${data.error_count > 1 ? "s" : ""} rapportée${
                    data.error_count > 1 ? "s" : ""
                  }`
                : undefined,
          },
        )
      }
    },
    onError: (error: Error) => {
      toast.error("Promotion échouée", { description: error.message })
    },
  })
}
