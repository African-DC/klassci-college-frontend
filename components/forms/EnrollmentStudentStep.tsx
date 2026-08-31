"use client"

import type { UseFormReturn } from "react-hook-form"
import type { NewEnrollment, ReEnrollment } from "@/lib/contracts/enrollment"
import type { Student } from "@/lib/contracts/student"
import { EnrollmentNewStudentStep } from "@/components/forms/EnrollmentNewStudentStep"
import { EnrollmentReenrollStep } from "@/components/forms/EnrollmentReenrollStep"

const EMPTY_PARENT = {
  first_name: "",
  last_name: "",
  phone: null,
  email: null,
  password: null,
  relationship_type: "guardian" as const,
  city: null,
  commune: null,
}

interface EnrollmentStudentStepProps {
  enrollmentType: "new" | "re-enrollment"
  newForm: UseFormReturn<NewEnrollment>
  reForm: UseFormReturn<ReEnrollment>
  students: Student[]
  studentsLoading: boolean
  selectedStudent?: Student
  photo: File | null
  onPhotoChange: (photo: File | null) => void
  disabled: boolean
  showParentFields: boolean
  showParentAccount: boolean
  onShowParentFields: (next: boolean) => void
  onShowParentAccount: (next: boolean) => void
}

/**
 * L'étape « Élève » : on saisit un nouveau dossier, ou on retrouve un dossier
 * existant.
 *
 * Replier le bloc parent efface aussi ce qu'il contenait : sans cela, un
 * parent saisi puis abandonné partait quand même au serveur, et l'école se
 * retrouvait avec un tuteur qu'elle croyait avoir retiré.
 */
export function EnrollmentStudentStep({
  enrollmentType,
  newForm,
  reForm,
  students,
  studentsLoading,
  selectedStudent,
  photo,
  onPhotoChange,
  disabled,
  showParentFields,
  showParentAccount,
  onShowParentFields,
  onShowParentAccount,
}: EnrollmentStudentStepProps) {
  if (enrollmentType === "re-enrollment") {
    return (
      <EnrollmentReenrollStep
        form={reForm}
        students={students}
        studentsLoading={studentsLoading}
        selectedStudent={selectedStudent}
      />
    )
  }

  return (
    <EnrollmentNewStudentStep
      form={newForm}
      photo={photo}
      onPhotoChange={onPhotoChange}
      disabled={disabled}
      showParentFields={showParentFields}
      showParentAccount={showParentAccount}
      onToggleParentFields={() => {
        const next = !showParentFields
        onShowParentFields(next)
        if (next) {
          newForm.setValue("parent", EMPTY_PARENT)
        } else {
          newForm.setValue("parent", null)
          onShowParentAccount(false)
        }
      }}
      onToggleParentAccount={(checked) => {
        onShowParentAccount(checked)
        if (!checked) newForm.setValue("parent.password", null)
      }}
    />
  )
}
