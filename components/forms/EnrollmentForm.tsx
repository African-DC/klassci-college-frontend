"use client"

import { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  NewEnrollmentSchema,
  ReEnrollmentSchema,
  type NewEnrollment,
  type ReEnrollment,
} from "@/lib/contracts/enrollment"
import type { Student } from "@/lib/contracts/student"
import type { Class } from "@/lib/contracts/class"
import { useCreateWithStudent, useReEnroll, useFeeVariants } from "@/lib/hooks/useEnrollments"
import { useStudents } from "@/lib/hooks/useStudents"
import { useClasses } from "@/lib/hooks/useClasses"
import { EnrollmentStudentStep } from "@/components/forms/EnrollmentStudentStep"
import { EnrollmentSummaryStep } from "@/components/forms/EnrollmentSummaryStep"
import { EnrollmentTypeStep } from "@/components/forms/EnrollmentTypeStep"
import { EnrollmentWizardShell } from "@/components/forms/EnrollmentWizardShell"
import { EnrollmentClassStep } from "@/components/forms/EnrollmentClassStep"
import { useAttachStudentPhoto } from "@/lib/hooks/useStudentPhoto"
import { useCurrentAcademicYearId } from "@/lib/hooks/useCurrentAcademicYear"
import {
  ENROLLMENT_STEPS,
  NEW_ENROLLMENT_DEFAULTS,
  RE_ENROLLMENT_DEFAULTS,
  inKindDepositsPayload,
  validateEnrollmentStep,
  type EnrollmentType,
} from "@/components/forms/enrollment-wizard"

interface EnrollmentFormProps {
  onSuccess: () => void
  /**
   * Élève pré-sélectionné (depuis ex. badge "À inscrire" sur /admin/students).
   * Quand fourni : le type est forcé à "re-enrollment", student_id est rempli
   * et le wizard saute directement à l'étape Classe — bug #22.
   */
  preselectedStudentId?: number
}

export function EnrollmentForm({ onSuccess, preselectedStudentId }: EnrollmentFormProps) {
  const [step, setStep] = useState(0)
  const [enrollmentType, setEnrollmentType] = useState<EnrollmentType | null>(null)
  const [showParentFields, setShowParentFields] = useState(false)
  const [showParentAccount, setShowParentAccount] = useState(false)
  const [maxReachedStep, setMaxReachedStep] = useState(0)
  const [photo, setPhoto] = useState<File | null>(null)
  const [inKindDeposits, setInKindDeposits] = useState<Record<number, boolean>>({})

  // Mutations
  const createWithStudent = useCreateWithStudent()
  const reEnroll = useReEnroll()
  const attachPhoto = useAttachStudentPhoto()

  // Data queries
  const { academicYearId } = useCurrentAcademicYearId()
  const { data: studentsData, isLoading: studentsLoading } = useStudents({ size: 100 })
  const { data: classesData, isLoading: classesLoading } = useClasses({ size: 100 })

  const students: Student[] = studentsData?.items ?? []
  const classes: Class[] = classesData?.items ?? []

  const newForm = useForm<NewEnrollment>({
    resolver: zodResolver(NewEnrollmentSchema),
    defaultValues: NEW_ENROLLMENT_DEFAULTS,
  })

  const reForm = useForm<ReEnrollment>({
    resolver: zodResolver(ReEnrollmentSchema),
    defaultValues: RE_ENROLLMENT_DEFAULTS,
  })

  const watchedClassId = enrollmentType === "new"
    ? newForm.watch("class_id")
    : reForm.watch("class_id")

  // Fee variants for selected class
  const { data: feeVariants, isLoading: feeVariantsLoading } = useFeeVariants(
    watchedClassId && watchedClassId > 0 ? watchedClassId : undefined
  )

  // Selected student for re-enrollment
  const selectedStudentId = enrollmentType === "re-enrollment" ? reForm.watch("student_id") : undefined
  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId]
  )

  // Selected class name for summary
  const selectedClassName = useMemo(
    () => classes.find((c) => c.id === watchedClassId)?.name ?? "",
    [classes, watchedClassId]
  )

  // Selected fee variant for summary
  const selectedFeeVariantId = enrollmentType === "new"
    ? newForm.watch("fee_variant_id")
    : reForm.watch("fee_variant_id")
  const selectedFeeVariant = useMemo(
    () => feeVariants?.find((v) => v.id === selectedFeeVariantId),
    [feeVariants, selectedFeeVariantId]
  )

  const isPending = createWithStudent.isPending || reEnroll.isPending || attachPhoto.isPending

  // Bug #22 : Quand un student_id arrive via query (?student_id=X), on
  // pré-remplit le formulaire re-enrollment et on saute directement à la
  // sélection de classe. Évite à l'admin de re-chercher l'élève qu'il
  // vient justement de cliquer dans la liste.
  useEffect(() => {
    if (preselectedStudentId && enrollmentType === null) {
      setEnrollmentType("re-enrollment")
      reForm.setValue("student_id", preselectedStudentId)
      setStep(2)
      setMaxReachedStep(2)
    }
  }, [preselectedStudentId, enrollmentType, reForm])

  function goToStep(target: number) {
    setStep(target)
    if (target > maxReachedStep) {
      setMaxReachedStep(target)
    }
  }

  async function handleNext() {
    const valid = await validateEnrollmentStep(step, enrollmentType, newForm, reForm, showParentFields)
    if (!valid || step >= ENROLLMENT_STEPS.length - 1) return
    goToStep(step + 1)
  }

  function handlePrevious() {
    if (step > 0) setStep(step - 1)
  }

  function handleSubmit() {
    if (enrollmentType === "new") {
      newForm.handleSubmit((data) => {
        // Clean up parent if not filled
        if (!showParentFields) {
          data.parent = null
        }
        data.in_kind_deposits = inKindDepositsPayload(inKindDeposits)
        createWithStudent.mutate(data, {
          onSuccess: async (enrollment) => {
            await attachPhoto.mutateAsync({ studentId: enrollment.student_id, photo })
            newForm.reset()
            setPhoto(null)
            onSuccess()
          },
        })
      })()
    } else {
      reForm.handleSubmit((data) => {
        data.in_kind_deposits = inKindDepositsPayload(inKindDeposits)
        reEnroll.mutate(data, {
          onSuccess: () => {
            reForm.reset()
            onSuccess()
          },
        })
      })()
    }
  }

  const submitLabel = attachPhoto.isPending
    ? "Envoi de la photo..."
    : isPending
      ? "Enregistrement..."
      : "Enregistrer l'inscription"

  return (
    <EnrollmentWizardShell
      steps={ENROLLMENT_STEPS}
      step={step}
      maxReachedStep={maxReachedStep}
      canNavigate={!!enrollmentType}
      onStepChange={setStep}
      onPrevious={handlePrevious}
      onNext={handleNext}
      onSubmit={handleSubmit}
      nextDisabled={step === 0 && !enrollmentType}
      pending={isPending}
      submitLabel={submitLabel}
    >
      {step === 0 && (
        <EnrollmentTypeStep value={enrollmentType} onChange={setEnrollmentType} />
      )}

      {step === 1 && (
        <EnrollmentStudentStep
          enrollmentType={enrollmentType === "re-enrollment" ? "re-enrollment" : "new"}
          newForm={newForm}
          reForm={reForm}
          students={students}
          studentsLoading={studentsLoading}
          selectedStudent={selectedStudent}
          photo={photo}
          onPhotoChange={setPhoto}
          disabled={isPending}
          showParentFields={showParentFields}
          showParentAccount={showParentAccount}
          onShowParentFields={setShowParentFields}
          onShowParentAccount={setShowParentAccount}
        />
      )}

      {/* Step 2: Class and fees */}
      {step === 2 && (
        <EnrollmentClassStep
          enrollmentType={enrollmentType === "re-enrollment" ? "re-enrollment" : "new"}
          newForm={newForm}
          reForm={reForm}
          classes={classes}
          classesLoading={classesLoading}
          feeVariants={feeVariants ?? []}
          feeVariantsLoading={feeVariantsLoading}
          inKindDeposits={inKindDeposits}
          onInKindDepositChange={(catId, deposited) =>
            setInKindDeposits((prev) => ({ ...prev, [catId]: deposited }))
          }
          onClassSelected={() => setInKindDeposits({})}
          academicYearId={academicYearId}
        />
      )}

      {step === ENROLLMENT_STEPS.length - 1 && (
        <EnrollmentSummaryStep
          enrollmentType={enrollmentType === "re-enrollment" ? "re-enrollment" : "new"}
          newValues={newForm.getValues()}
          reValues={reForm.getValues()}
          selectedStudent={selectedStudent}
          selectedClassName={selectedClassName}
          watchedClassId={watchedClassId}
          feeVariants={feeVariants ?? []}
          selectedFeeVariant={selectedFeeVariant}
          photo={photo}
          showParentFields={showParentFields}
          createError={createWithStudent.error?.message}
          reEnrollError={reEnroll.error?.message}
          inKindDeposits={inKindDeposits}
        />
      )}

    </EnrollmentWizardShell>
  )
}
