"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { gradesApi } from "@/lib/api/grades"
import type {
  Evaluation,
  Grade,
  EvaluationCreate,
  GradeBatchUpdate,
} from "@/lib/contracts/grade"

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
    mutationFn: (data: EvaluationCreate) => gradesApi.createEvaluation(data),
    onMutate: async (newEval) => {
      await queryClient.cancelQueries({ queryKey: gradeKeys.evaluations(newEval.class_id) })
      const prev = queryClient.getQueryData<Evaluation[]>(gradeKeys.evaluations(newEval.class_id))
      const optimistic: Evaluation = {
        id: -Date.now(),
        title: newEval.title,
        type: newEval.type as Evaluation["type"],
        date: newEval.date,
        coefficient: newEval.coefficient,
        subject_id: newEval.subject_id,
        subject_name: "",
        class_id: newEval.class_id,
        class_name: "",
        teacher_id: 0,
        teacher_name: "",
        total_students: 0,
        graded_students: 0,
        created_at: new Date().toISOString(),
      }
      if (prev) {
        queryClient.setQueryData(gradeKeys.evaluations(newEval.class_id), [...prev, optimistic])
      }
      return { prev, classId: newEval.class_id }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(gradeKeys.evaluations(context.classId), context.prev)
      }
      toast.error("Erreur", { description: _err.message })
    },
    onSuccess: (data) => {
      toast.success("Evaluation creee", { description: data.title })
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.evaluations(vars.class_id) })
    },
  })
}

export function useUpdateGrades(evaluationId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: GradeBatchUpdate) => gradesApi.updateGrades(evaluationId, data),
    onMutate: async (batch) => {
      await queryClient.cancelQueries({ queryKey: gradeKeys.grades(evaluationId) })
      const prev = queryClient.getQueryData<Grade[]>(gradeKeys.grades(evaluationId))
      if (prev) {
        const updated = prev.map((g) => {
          const match = batch.grades.find((bg) => bg.student_id === g.student_id)
          return match ? { ...g, value: match.value } : g
        })
        queryClient.setQueryData(gradeKeys.grades(evaluationId), updated)
      }
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(gradeKeys.grades(evaluationId), context.prev)
      }
      toast.error("Erreur de sauvegarde", { description: _err.message })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.grades(evaluationId) })
      queryClient.invalidateQueries({ queryKey: gradeKeys.all })
    },
  })
}
