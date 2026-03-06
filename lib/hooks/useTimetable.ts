"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  timetableApi,
  type TimetableSlotCreateBody,
  type TimetableSlotUpdateBody,
} from "@/lib/api/timetable"

export const timetableKeys = {
  all: ["timetable"] as const,
  byClass: (classId: number) => ["timetable", "class", classId] as const,
  byTeacher: (teacherId: number) => ["timetable", "teacher", teacherId] as const,
}

export function useTimetable(classId: number) {
  return useQuery({
    queryKey: timetableKeys.byClass(classId),
    queryFn: () => timetableApi.listByClass(classId),
    enabled: !!classId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useTeacherTimetable(teacherId: number) {
  return useQuery({
    queryKey: timetableKeys.byTeacher(teacherId),
    queryFn: () => timetableApi.listByTeacher(teacherId),
    enabled: !!teacherId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TimetableSlotCreateBody) => timetableApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}

export function useUpdateSlot(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TimetableSlotUpdateBody) => timetableApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}

export function useDeleteSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => timetableApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}

export function useGenerateTimetable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (classId: number) => timetableApi.generate(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}
