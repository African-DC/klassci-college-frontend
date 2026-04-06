"use client"

import { enrollmentsApi } from "@/lib/api/enrollments"
import type { Enrollment, EnrollmentCreate, EnrollmentUpdate } from "@/lib/contracts/enrollment"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: enrollmentKeys,
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Enrollment, EnrollmentCreate, EnrollmentUpdate>("enrollments", enrollmentsApi, {
  created: "Inscription créée avec succès",
  updated: "Inscription mise à jour",
  deleted: "Inscription supprimée",
})

export { enrollmentKeys }
export const useEnrollments = useList
export const useEnrollment = useDetail
export const useCreateEnrollment = useCreate
export const useUpdateEnrollment = useUpdate
export const useDeleteEnrollment = useDelete
