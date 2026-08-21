"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { paymentsApi } from "@/lib/api/payments"
import { paymentMethodSettingsApi } from "@/lib/api/payment-method-settings"
import type { PaymentMethodSettingsUpdate } from "@/lib/contracts/payment-method-settings"

export const paymentMethodKeys = {
  mine: ["payment-methods", "mine"] as const,
  settings: ["payment-methods", "settings"] as const,
}

/**
 * Les moyens que l'utilisateur courant peut réellement saisir.
 *
 * Le sélecteur d'encaissement se remplit d'ici. Proposer un moyen pour le
 * refuser au moment d'enregistrer ferait recommencer la saisie devant la
 * famille : un choix affiché est un choix qui doit marcher.
 */
export function useMyPaymentMethods() {
  return useQuery({
    queryKey: paymentMethodKeys.mine,
    queryFn: paymentsApi.myMethods,
    // La configuration bouge rarement, et le guichet ouvre le formulaire
    // cinquante fois par jour.
    staleTime: 1000 * 60 * 10,
  })
}

export function usePaymentMethodSettings() {
  return useQuery({
    queryKey: paymentMethodKeys.settings,
    queryFn: paymentMethodSettingsApi.get,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdatePaymentMethodSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PaymentMethodSettingsUpdate) => paymentMethodSettingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.settings })
      // Le sélecteur de la personne connectée peut changer dans la foulée si
      // elle vient de modifier son propre profil.
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.mine })
      toast.success("Moyens de paiement mis à jour")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour")
    },
  })
}
