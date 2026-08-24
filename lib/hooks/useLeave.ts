"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { leaveApi } from "@/lib/api/leave"

export const leaveKeys = {
  mine: ["leave", "me"] as const,
  all: (status?: string) => ["leave", "all", status ?? "any"] as const,
}

export function useMyLeaveRequests() {
  return useQuery({
    queryKey: leaveKeys.mine,
    queryFn: leaveApi.myRequests,
    staleTime: 1000 * 60,
  })
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: leaveApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave"] })
      toast.success("Demande de congé envoyée")
    },
    onError: (err: Error) => toast.error("Erreur", { description: err.message }),
  })
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => leaveApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave"] })
      toast.success("Demande annulée")
    },
    onError: (err: Error) => toast.error("Erreur", { description: err.message }),
  })
}

export function useLeaveRequests(status?: string) {
  return useQuery({
    queryKey: leaveKeys.all(status),
    queryFn: () => leaveApi.all(status),
    staleTime: 1000 * 30,
  })
}

export function useReviewLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, approve, comment }: { id: number; approve: boolean; comment?: string }) =>
      approve ? leaveApi.approve(id, comment) : leaveApi.reject(id, comment),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["leave"] })
      toast.success(vars.approve ? "Congé approuvé" : "Congé refusé")
    },
    onError: (err: Error) => toast.error("Erreur", { description: err.message }),
  })
}

export function useSetInterim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, teacherId }: { id: number; teacherId: number | null }) =>
      leaveApi.setInterim(id, teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave"] })
      toast.success("Remplaçant mis à jour")
    },
    onError: (err: Error) => toast.error("Erreur", { description: err.message }),
  })
}
