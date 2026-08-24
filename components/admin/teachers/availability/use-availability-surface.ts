"use client"

/**
 * D'où viennent les disponibilités affichées par la grille, et où vont les
 * modifications.
 *
 * La même grille sert deux personnes : l'administration qui saisit pour un
 * enseignant donné, et l'enseignant qui gère les siennes depuis son portail.
 * Les gestes sont identiques, seules les routes changent — et côté portail le
 * backend résout l'enseignant depuis le jeton, si bien que le front n'a aucun
 * identifiant à transmettre. Une seule grille, deux surfaces.
 */

import { useCallback, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { timetableApi } from "@/lib/api/timetable"
import { timetableKeys, useMyAvailabilities, useTeacherAvailabilities } from "@/lib/hooks/useTimetable"
import type {
  TeacherAvailability,
  TeacherAvailabilityCreate,
  TeacherAvailabilityUpdate,
} from "@/lib/contracts/timetable"

export interface AvailabilitySurface {
  availabilities: TeacherAvailability[] | undefined
  isLoading: boolean
  create: (data: TeacherAvailabilityCreate) => Promise<unknown>
  update: (id: number, data: TeacherAvailabilityUpdate) => Promise<unknown>
  remove: (id: number) => Promise<unknown>
  invalidate: () => Promise<void>
}

/** `teacherId` absent = l'enseignant connecté gère ses propres plages. */
export function useAvailabilitySurface(teacherId?: number): AvailabilitySurface {
  const queryClient = useQueryClient()
  const soi = teacherId === undefined

  const duProf = useTeacherAvailabilities(soi ? 0 : teacherId)
  const lesMiennes = useMyAvailabilities()
  const source = soi ? lesMiennes : duProf

  const invalidate = useCallback(async () => {
    if (soi) {
      await queryClient.invalidateQueries({ queryKey: timetableKeys.myAvailabilities() })
      await queryClient.invalidateQueries({ queryKey: timetableKeys.myWeek() })
      return
    }
    await queryClient.invalidateQueries({ queryKey: timetableKeys.availabilities(teacherId) })
    await queryClient.invalidateQueries({ queryKey: timetableKeys.teacherWeek(teacherId) })
    await queryClient.invalidateQueries({ queryKey: ["teachers", teacherId, "full"] })
  }, [queryClient, soi, teacherId])

  return useMemo(
    () => ({
      availabilities: source.data,
      isLoading: source.isLoading,
      create: (data) =>
        soi
          ? timetableApi.declareMyAvailability(data)
          : timetableApi.createAvailability(teacherId as number, data),
      update: (id, data) =>
        soi
          ? timetableApi.updateMyAvailability(id, data)
          : timetableApi.updateAvailability(id, data),
      remove: (id) =>
        soi ? timetableApi.deleteMyAvailability(id) : timetableApi.deleteAvailability(id),
      invalidate,
    }),
    [source.data, source.isLoading, soi, teacherId, invalidate],
  )
}
