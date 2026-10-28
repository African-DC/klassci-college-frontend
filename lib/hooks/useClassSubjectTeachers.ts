"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { classSubjectTeachersApi } from "@/lib/api/class-subject-teachers"
import type { ClassSubjectTeacherAssignment } from "@/lib/contracts/class-subject-teachers"

export const classSubjectTeachersKeys = {
  byClass: (classId: number) => ["class-subject-teachers", classId] as const,
}

export function useClassSubjectTeachers(classId: number | undefined) {
  return useQuery({
    queryKey: classSubjectTeachersKeys.byClass(classId ?? 0),
    queryFn: () => classSubjectTeachersApi.get(classId as number),
    enabled: !!classId,
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
    },
  })
}
