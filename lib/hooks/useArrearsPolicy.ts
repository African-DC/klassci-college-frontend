"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { arrearsPolicyApi } from "@/lib/api/arrears-policy"
import type { ArrearsPolicyUpdate } from "@/lib/contracts/arrears-policy"

export const arrearsPolicyKeys = {
  settings: ["admin", "arrears-policy"] as const,
}

/** Le réglage en place. Interrogé seulement quand l'écran a le droit de l'afficher. */
export function useArrearsPolicy(enabled = true) {
  return useQuery({
    queryKey: arrearsPolicyKeys.settings,
    queryFn: arrearsPolicyApi.get,
    staleTime: 1000 * 60 * 5,
    enabled,
  })
}

export function useUpdateArrearsPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ArrearsPolicyUpdate) => arrearsPolicyApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: arrearsPolicyKeys.settings })
      toast.success("Politique enregistrée")
    },
    onError: (error: Error) => {
      toast.error("Enregistrement impossible", { description: error.message })
    },
  })
}
