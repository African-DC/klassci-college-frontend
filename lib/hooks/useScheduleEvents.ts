"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { scheduleEventsApi } from "@/lib/api/schedule-events"
import type { ScheduleEventCreate } from "@/lib/contracts/schedule-events"

const all = ["schedule-events"] as const
export function useScheduleEvents(yearId: number | null, classId?: number) {
  return useQuery({
    queryKey: [...all, yearId, classId ?? "all"],
    queryFn: () => scheduleEventsApi.list(yearId as number, classId),
    enabled: !!yearId,
  })
}

export function useScheduleEventMutations() {
  const client = useQueryClient()
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: all }),
      client.invalidateQueries({ queryKey: ["timetable"] }),
    ])
  }
  return {
    createMany: useMutation({
      mutationFn: ({ data, days }: {
        data: ScheduleEventCreate; days: ScheduleEventCreate["day"][]
      }) => scheduleEventsApi.createMany(data, days),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: number; data: ScheduleEventCreate }) =>
        scheduleEventsApi.update(id, data),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: number) => scheduleEventsApi.delete(id),
      onSuccess: refresh,
    }),
  }
}
