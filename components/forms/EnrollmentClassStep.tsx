"use client"

import type { Class } from "@/lib/contracts/class"
import type { FeeVariantOption, NewEnrollment, ReEnrollment } from "@/lib/contracts/enrollment"
import type { UseFormReturn } from "react-hook-form"
import { Form } from "@/components/ui/form"
import { AssignmentStatusField } from "@/components/forms/AssignmentStatusField"
import { ClassAndFeesFields } from "@/components/forms/EnrollmentClassFields"
import { NewStudentField } from "@/components/forms/NewStudentField"

interface EnrollmentClassStepProps {
  enrollmentType: "new" | "re-enrollment"
  newForm: UseFormReturn<NewEnrollment>
  reForm: UseFormReturn<ReEnrollment>
  classes: Class[]
  classesLoading: boolean
  feeVariants: FeeVariantOption[]
  feeVariantsLoading: boolean
  inKindDeposits: Record<number, boolean>
  onInKindDepositChange: (feeCategoryId: number, deposited: boolean) => void
  /** Changer de classe change les frais : les dépôts en nature cochés tombent. */
  onClassSelected: () => void
  /** L'année sur laquelle porte l'inscription, pour interroger la suggestion. */
  academicYearId?: number
}

/**
 * L'étape « Classe » : la classe, les frais, l'affectation, et le profil.
 *
 * Ces trois décisions vivent ensemble parce qu'elles décident toutes du montant
 * que la famille verra sur sa facture, et qu'aucune ne se rattrape après coup
 * sans régénérer les frais.
 */
export function EnrollmentClassStep({
  enrollmentType,
  newForm,
  reForm,
  classes,
  classesLoading,
  feeVariants,
  feeVariantsLoading,
  inKindDeposits,
  onInKindDepositChange,
  onClassSelected,
  academicYearId,
}: EnrollmentClassStepProps) {
  const shared = {
    classes,
    classesLoading,
    feeVariants,
    feeVariantsLoading,
    inKindDeposits,
    onInKindDepositChange,
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choisissez la classe et la formule de frais.
      </p>

      {enrollmentType === "new" ? (
        <>
          <ClassAndFeesFields
            {...shared}
            classId={newForm.watch("class_id")}
            feeVariantId={newForm.watch("fee_variant_id")}
            notes={newForm.watch("notes")}
            onClassChange={(id) => {
              newForm.setValue("class_id", id, { shouldValidate: true })
              onClassSelected()
            }}
            onFeeVariantChange={(id) => newForm.setValue("fee_variant_id", id)}
            onNotesChange={(val) => newForm.setValue("notes", val)}
            classError={newForm.formState.errors.class_id?.message}
          />

          {/* L'affectation decide du tarif : elle se saisit ici, avec la
              classe, et non apres coup sur une inscription deja creee. */}
          <Form {...newForm}>
            <AssignmentStatusField
              control={newForm.control}
              statusName="assignment_status"
              decisionName="assignment_decision_number"
              status={newForm.watch("assignment_status")}
              onDecisionCleared={() => newForm.setValue("assignment_decision_number", null)}
            />
          </Form>

          {/* Aucun identifiant d'élève à interroger : il est créé par ce
              formulaire. Le serveur ne peut donc rien suggérer, et l'écran le
              dit au lieu de cocher pour elle. */}
          <NewStudentField
            academicYearId={academicYearId}
            value={newForm.watch("is_new_student")}
            error={newForm.formState.errors.is_new_student?.message}
            onChange={(val) => {
              newForm.setValue("is_new_student", val)
              newForm.clearErrors("is_new_student")
            }}
          />
        </>
      ) : (
        <>
          <ClassAndFeesFields
            {...shared}
            classId={reForm.watch("class_id")}
            feeVariantId={reForm.watch("fee_variant_id")}
            notes={reForm.watch("notes")}
            onClassChange={(id) => {
              reForm.setValue("class_id", id, { shouldValidate: true })
              onClassSelected()
            }}
            onFeeVariantChange={(id) => reForm.setValue("fee_variant_id", id)}
            onNotesChange={(val) => reForm.setValue("notes", val)}
            classError={reForm.formState.errors.class_id?.message}
          />

          <Form {...reForm}>
            <AssignmentStatusField
              control={reForm.control}
              statusName="assignment_status"
              decisionName="assignment_decision_number"
              status={reForm.watch("assignment_status")}
              onDecisionCleared={() => reForm.setValue("assignment_decision_number", null)}
            />
          </Form>

          <NewStudentField
            studentId={reForm.watch("student_id")}
            academicYearId={academicYearId}
            value={reForm.watch("is_new_student")}
            error={reForm.formState.errors.is_new_student?.message}
            onChange={(val) => {
              reForm.setValue("is_new_student", val)
              reForm.clearErrors("is_new_student")
            }}
          />
        </>
      )}
    </div>
  )
}
