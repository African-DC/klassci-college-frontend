"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { gradesApi, type EvaluationListQuery } from "@/lib/api/grades"
import type {
  Evaluation,
  EvaluationListResponse,
  Grade,
  EvaluationCreate,
  GradeBatchUpdate,
} from "@/lib/contracts/grade"

export const gradeKeys = {
  all: ["grades"] as const,
  /** Racine des listes d'une classe : sert aux invalidations, toutes pages confondues. */
  evaluationsRoot: (classId: number) => ["grades", "evaluations", classId] as const,
  evaluations: (classId: number, query: EvaluationListQuery = {}) =>
    ["grades", "evaluations", classId, query] as const,
  teacherEvaluations: (teacherId: number, query: EvaluationListQuery = {}) =>
    ["grades", "teacher-evaluations", teacherId, query] as const,
  evaluation: (evaluationId: number) => ["grades", "evaluation", evaluationId] as const,
  grades: (evaluationId: number) => ["grades", "entries", evaluationId] as const,
}

export function useEvaluations(classId: number, query: EvaluationListQuery = {}) {
  return useQuery({
    queryKey: gradeKeys.evaluations(classId, query),
    queryFn: () => gradesApi.listEvaluations(classId, query),
    enabled: !!classId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useTeacherEvaluations(teacherId: number, query: EvaluationListQuery = {}) {
  return useQuery({
    queryKey: gradeKeys.teacherEvaluations(teacherId, query),
    queryFn: () => gradesApi.listByTeacher(teacherId, query),
    enabled: !!teacherId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * L'évaluation en cours de saisie, lue seule. Les écrans de notes
 * parcouraient la liste de la classe pour y retrouver cette ligne, ce
 * qu'une liste paginée ne garantit plus.
 */
export function useEvaluation(evaluationId: number | undefined) {
  return useQuery({
    queryKey: gradeKeys.evaluation(evaluationId ?? 0),
    queryFn: () => gradesApi.getEvaluation(evaluationId as number),
    enabled: !!evaluationId,
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
      const root = { queryKey: gradeKeys.evaluationsRoot(newEval.class_id) }
      await queryClient.cancelQueries(root)
      const snapshot = queryClient.getQueriesData<EvaluationListResponse>(root)
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
        academic_year_id: 0,
        trimester: 0,
        total_students: 0,
        graded_students: 0,
        created_at: new Date().toISOString(),
      }
      // La liste est triée par date décroissante : la nouvelle évaluation
      // se place en tête. `total` suit, sinon le compteur d'écran mentirait
      // d'une unité jusqu'au prochain rafraîchissement.
      queryClient.setQueriesData<EvaluationListResponse>(root, (prev) =>
        prev ? { ...prev, items: [optimistic, ...prev.items], total: prev.total + 1 } : prev,
      )
      return { snapshot }
    },
    onError: (err, _vars, context) => {
      for (const [key, data] of context?.snapshot ?? []) {
        queryClient.setQueryData(key, data)
      }
      toast.error("Erreur", { description: err.message })
    },
    onSuccess: (data) => {
      toast.success("Evaluation creee", { description: data.title })
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.evaluationsRoot(vars.class_id) })
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
          if (!match) return g
          // Absent : le backend inscrit un zéro d'office. L'affichage optimiste
          // doit dire la même chose, sinon la case repasse « non saisie » une
          // seconde avant que le serveur ne réponde le contraire.
          if (match.absent) return { ...g, value: 0, status: "absent" }
          return {
            ...g,
            value: match.value,
            status: match.value !== null ? "entered" : "pending",
          }
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
    onSuccess: (data) => {
      queryClient.setQueryData(gradeKeys.grades(evaluationId), data)
      // Le « 12 / 35 » de l'évaluation change à chaque enregistrement et
      // vient maintenant du serveur : la fiche doit être redemandée.
      queryClient.invalidateQueries({ queryKey: gradeKeys.evaluation(evaluationId) })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.grades(evaluationId) })
    },
  })
}
