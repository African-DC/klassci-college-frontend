"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  gradesApi,
  type EvaluationCreateBody,
  type GradeBatchUpdateBody,
} from "@/lib/api/grades"

export const gradeKeys = {
  all: ["grades"] as const,
  evaluations: (classId: number) => ["grades", "evaluations", classId] as const,
  grades: (evaluationId: number) => ["grades", "entries", evaluationId] as const,
}

export function useEvaluations(classId: number) {
  return useQuery({
    queryKey: gradeKeys.evaluations(classId),
    queryFn: () => gradesApi.listEvaluations(classId),
    enabled: !!classId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useGrades(evaluationId: number) {
  return useQuery({
    queryKey: gradeKeys.grades(evaluationId),
    queryFn: () => gradesApi.getGrades(evaluationId),
    enabled: !!evaluationId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EvaluationCreateBody) => gradesApi.createEvaluation(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.evaluations(data.class_id) })
    },
  })
}

export function useUpdateGrades(evaluationId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: GradeBatchUpdateBody) => gradesApi.updateGrades(evaluationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.grades(evaluationId) })
      queryClient.invalidateQueries({ queryKey: gradeKeys.all })
    },
  })
}
