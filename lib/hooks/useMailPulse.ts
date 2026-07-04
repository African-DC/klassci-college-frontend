"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { mailpulseApi } from "@/lib/api/mailpulse"
import type { MailPulseConfigForm, MailPulseTestRequest } from "@/lib/contracts/mailpulse"

export const mailpulseKeys = {
  all: ["mailpulse"] as const,
}

export function useMailPulseConfig() {
  return useQuery({
    queryKey: mailpulseKeys.all,
    queryFn: mailpulseApi.get,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateMailPulse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MailPulseConfigForm) => mailpulseApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mailpulseKeys.all })
      toast.success("Configuration MailPulse enregistrée")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement")
    },
  })
}

export function useTestMailPulse() {
  return useMutation({
    mutationFn: (data: MailPulseTestRequest) => mailpulseApi.test(data),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi du test")
    },
  })
}
