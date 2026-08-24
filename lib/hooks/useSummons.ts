"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { summonsApi, type SummonsRegisterFilters } from "@/lib/api/summons"
import { fileSafeName } from "@/components/admin/classes/detail/class-downloads"
import { downloadBlob } from "@/lib/utils"
import type {
  ParentSummons,
  ParentSummonsCreate,
  SummonsOutcomeUpdate,
} from "@/lib/contracts/school-life"

export const summonsKeys = {
  all: ["school-life", "summons"] as const,
  register: (filters: SummonsRegisterFilters) =>
    ["school-life", "summons", "register", filters] as const,
}

export function useSummonsRegister(filters: SummonsRegisterFilters = {}, enabled = true) {
  return useQuery({
    queryKey: summonsKeys.register(filters),
    queryFn: () => summonsApi.list(filters),
    staleTime: 1000 * 30,
    enabled,
  })
}

export function useCreateSummons() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ParentSummonsCreate) => summonsApi.create(data),
    onSuccess: (summons) => {
      queryClient.invalidateQueries({ queryKey: summonsKeys.all })
      toast.success("Convocation enregistrée", {
        description: `${summons.student_name} · ${summons.parent_name ?? "tuteur"}`,
      })
    },
    onError: (err: Error) =>
      toast.error("Convocation impossible", { description: err.message }),
  })
}

export function useRecordSummonsOutcome() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SummonsOutcomeUpdate }) =>
      summonsApi.recordOutcome(id, data),
    onSuccess: (summons) => {
      queryClient.invalidateQueries({ queryKey: summonsKeys.all })
      toast.success("Suite donnée enregistrée", { description: summons.outcome_label })
    },
    onError: (err: Error) =>
      toast.error("Enregistrement impossible", { description: err.message }),
  })
}

export function useDownloadSummons() {
  return useMutation({
    mutationFn: async (summons: ParentSummons) => {
      const blob = await summonsApi.downloadDocument(summons.id)
      downloadBlob(
        blob,
        `convocation-${fileSafeName(summons.student_name)}-${summons.id}.pdf`,
      )
    },
    onSuccess: () => toast.success("Convocation téléchargée"),
    onError: (err: Error) =>
      toast.error("Téléchargement impossible", { description: err.message }),
  })
}
