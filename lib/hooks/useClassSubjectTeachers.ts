"use client"

import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { classSubjectTeachersApi } from "@/lib/api/class-subject-teachers"
import { timetableKeys } from "@/lib/hooks/useTimetable"
import type { ClassSubjectTeacherAssignment } from "@/lib/contracts/class-subject-teachers"

export const classSubjectTeachersKeys = {
  byClass: (classId: number | undefined) => ["class-subject-teachers", classId] as const,
}

export function useClassSubjectTeachers(classId: number | undefined) {
  return useQuery({
    queryKey: classSubjectTeachersKeys.byClass(classId),
    queryFn: classId === undefined ? skipToken : () => classSubjectTeachersApi.get(classId),
    staleTime: 1000 * 60,
  })
}

export function useSaveClassSubjectTeachers(classId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignments: ClassSubjectTeacherAssignment[]) =>
      classSubjectTeachersApi.save(classId, assignments),
    onSuccess: (data) => {
      queryClient.setQueryData(classSubjectTeachersKeys.byClass(classId), data)
      // Le diagnostic et l'emploi du temps dépendent des enseignants retenus.
      void queryClient.invalidateQueries({ queryKey: timetableKeys.diagnostic(classId) })
      void queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}
