"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { timetableApi } from "@/lib/api/timetable"
import type {
  TimetableSlot,
  TimetableSlotCreate,
  TimetableSlotUpdate,
} from "@/lib/contracts/timetable"

export const timetableKeys = {
  all: ["timetable"] as const,
  byClass: (classId: number, weekOffset?: number) =>
    ["timetable", "class", classId, weekOffset ?? 0] as const,
  byTeacher: (teacherId: number) => ["timetable", "teacher", teacherId] as const,
}

export function useTimetable(classId: number, weekOffset: number = 0) {
  return useQuery({
    queryKey: timetableKeys.byClass(classId, weekOffset),
    queryFn: () => timetableApi.listByClass(classId, weekOffset),
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
    mutationFn: (data: TimetableSlotCreate) => timetableApi.create(data),
    onMutate: async (newSlot) => {
      await queryClient.cancelQueries({ queryKey: timetableKeys.all })
      const queries = queryClient.getQueriesData<TimetableSlot[]>({
        queryKey: timetableKeys.all,
      })
      const optimistic: TimetableSlot = {
        id: -Date.now(),
        class_id: newSlot.class_id,
        class_name: "",
        teacher_id: newSlot.teacher_id,
        teacher_name: "",
        subject_id: newSlot.subject_id,
        subject_name: "",
        day: newSlot.day as TimetableSlot["day"],
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        room: newSlot.room,
      }
      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData(key, [...data, optimistic])
        }
      }
      return { queries }
    },
    onError: (err, _vars, context) => {
      if (context?.queries) {
        for (const [key, data] of context.queries) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: err.message })
    },
    onSuccess: () => {
      toast.success("Créneau créé avec succès")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}

export function useUpdateSlot(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TimetableSlotUpdate) => timetableApi.update(id, data),
    onMutate: async (updatedFields) => {
      await queryClient.cancelQueries({ queryKey: timetableKeys.all })
      const queries = queryClient.getQueriesData<TimetableSlot[]>({
        queryKey: timetableKeys.all,
      })
      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData(
            key,
            data.map((s) => (s.id === id ? { ...s, ...updatedFields } : s)),
          )
        }
      }
      return { queries }
    },
    onError: (err, _vars, context) => {
      if (context?.queries) {
        for (const [key, data] of context.queries) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: err.message })
    },
    onSuccess: () => {
      toast.success("Créneau mis à jour")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}

export function useDeleteSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => timetableApi.remove(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: timetableKeys.all })
      const queries = queryClient.getQueriesData<TimetableSlot[]>({
        queryKey: timetableKeys.all,
      })
      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData(
            key,
            data.filter((s) => s.id !== deletedId),
          )
        }
      }
      return { queries }
    },
    onError: (err, _vars, context) => {
      if (context?.queries) {
        for (const [key, data] of context.queries) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: err.message })
    },
    onSuccess: () => {
      toast.success("Créneau supprimé")
    },
    onSettled: () => {
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
      toast.success("Génération de l'emploi du temps lancée")
    },
    onError: (err) => {
      toast.error("Erreur", { description: err.message })
    },
  })
}
