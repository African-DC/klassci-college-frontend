"use client"

import { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  UserPlus,
  RefreshCw,
  GraduationCap,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
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
import { Form } from "@/components/ui/form"
import { AssignmentStatusField } from "@/components/forms/AssignmentStatusField"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { EnrollmentNewStudentStep } from "@/components/forms/EnrollmentNewStudentStep"
import { EnrollmentReenrollStep } from "@/components/forms/EnrollmentReenrollStep"
import { EnrollmentSummaryStep } from "@/components/forms/EnrollmentSummaryStep"
import { ClassAndFeesFields } from "@/components/forms/EnrollmentClassFields"
import { useAttachStudentPhoto } from "@/lib/hooks/useStudentPhoto"

type EnrollmentType = "new" | "re-enrollment"

const STEPS = [
  { id: "type", label: "Type", icon: GraduationCap },
  { id: "student", label: "Élève", icon: UserPlus },
  { id: "class", label: "Classe", icon: GraduationCap },
  { id: "summary", label: "Résumé", icon: Check },
] as const

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

  // Mutations
  const createWithStudent = useCreateWithStudent()
  const reEnroll = useReEnroll()
  const attachPhoto = useAttachStudentPhoto()

  // Data queries
  const { data: studentsData, isLoading: studentsLoading } = useStudents({ size: 100 })
  const { data: classesData, isLoading: classesLoading } = useClasses({ size: 100 })

  const students: Student[] = studentsData?.items ?? []
  const classes: Class[] = classesData?.items ?? []

  // New enrollment form
  const newForm = useForm<NewEnrollment>({
    resolver: zodResolver(NewEnrollmentSchema),
    defaultValues: {
      type: "new",
      first_name: "",
      last_name: "",
      birth_date: null,
      genre: null,
      enrollment_number: null,
      city: null,
      commune: null,
      parent: null,
      class_id: undefined,
      assignment_status: null,
      assignment_decision_number: null,
      fee_variant_id: null,
      notes: null,
    },
  })

  // Re-enrollment form
  const reForm = useForm<ReEnrollment>({
    resolver: zodResolver(ReEnrollmentSchema),
    defaultValues: {
      type: "re-enrollment",
      student_id: undefined,
      class_id: undefined,
      assignment_status: null,
      assignment_decision_number: null,
      fee_variant_id: null,
      notes: null,
    },
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
    if (step === 0) {
      if (!enrollmentType) return
      goToStep(1)
      return
    }

    if (step === 1) {
      if (enrollmentType === "new") {
        const valid = await newForm.trigger(["first_name", "last_name", "birth_date", "genre", "enrollment_number"])
        if (!valid) return
        // Validate parent fields if shown
        if (showParentFields) {
          const parentValid = await newForm.trigger(["parent.first_name", "parent.last_name", "parent.phone", "parent.email", "parent.relationship_type"])
          if (!parentValid) return
        }
      } else {
        const valid = await reForm.trigger(["student_id"])
        if (!valid) return
      }
      goToStep(2)
      return
    }

    if (step === 2) {
      if (enrollmentType === "new") {
        const valid = await newForm.trigger(["class_id"])
        if (!valid) return
      } else {
        const valid = await reForm.trigger(["class_id"])
        if (!valid) return
      }
      goToStep(3)
      return
    }
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
        reEnroll.mutate(data, {
          onSuccess: () => {
            reForm.reset()
            onSuccess()
          },
        })
      })()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <Tabs value={STEPS[step].id} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {STEPS.map((s, i) => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              disabled={i > maxReachedStep || (i > 0 && !enrollmentType)}
              onClick={() => {
                if (i <= maxReachedStep) setStep(i)
              }}
              className="text-xs sm:text-sm"
            >
              <s.icon className="mr-1.5 h-3.5 w-3.5 hidden sm:inline-block" />
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Step 0: Type selection */}
      {step === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choisissez le type d&apos;inscription à effectuer.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              className={cn(
                "cursor-pointer transition-colors hover:border-primary/50",
                enrollmentType === "new" && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => setEnrollmentType("new")}
            >
              <CardContent className="flex flex-col items-center gap-3 pt-6 pb-4">
                <div className={cn(
                  "rounded-full p-3",
                  enrollmentType === "new" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <UserPlus className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Nouvelle inscription</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Inscrire un nouvel élève
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "cursor-pointer transition-colors hover:border-primary/50",
                enrollmentType === "re-enrollment" && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => setEnrollmentType("re-enrollment")}
            >
              <CardContent className="flex flex-col items-center gap-3 pt-6 pb-4">
                <div className={cn(
                  "rounded-full p-3",
                  enrollmentType === "re-enrollment" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <RefreshCw className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Réinscription</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Réinscrire un élève existant
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 1: Student info */}
      {step === 1 && enrollmentType === "new" && (
        <EnrollmentNewStudentStep
          form={newForm}
          photo={photo}
          onPhotoChange={setPhoto}
          disabled={isPending}
          showParentFields={showParentFields}
          showParentAccount={showParentAccount}
          onToggleParentFields={() => {
            const next = !showParentFields
            setShowParentFields(next)
            if (!next) {
              newForm.setValue("parent", null)
              setShowParentAccount(false)
            } else {
              newForm.setValue("parent", {
                first_name: "",
                last_name: "",
                phone: null,
                email: null,
                password: null,
                relationship_type: "guardian",
                city: null,
                commune: null,
              })
            }
          }}
          onToggleParentAccount={(checked) => {
            setShowParentAccount(checked)
            if (!checked) {
              newForm.setValue("parent.password", null)
            }
          }}
        />
      )}

      {step === 1 && enrollmentType === "re-enrollment" && (
        <EnrollmentReenrollStep
          form={reForm}
          students={students}
          studentsLoading={studentsLoading}
          selectedStudent={selectedStudent}
        />
      )}

      {/* Step 2: Class and fees */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choisissez la classe et la formule de frais.
          </p>

          {enrollmentType === "new" ? (
            <ClassAndFeesFields
              classes={classes}
              classesLoading={classesLoading}
              feeVariants={feeVariants ?? []}
              feeVariantsLoading={feeVariantsLoading}
              classId={newForm.watch("class_id")}
              feeVariantId={newForm.watch("fee_variant_id")}
              notes={newForm.watch("notes")}
              onClassChange={(id) => newForm.setValue("class_id", id, { shouldValidate: true })}
              onFeeVariantChange={(id) => newForm.setValue("fee_variant_id", id)}
              onNotesChange={(val) => newForm.setValue("notes", val)}
              classError={newForm.formState.errors.class_id?.message}
            />
          ) : (
            <ClassAndFeesFields
              classes={classes}
              classesLoading={classesLoading}
              feeVariants={feeVariants ?? []}
              feeVariantsLoading={feeVariantsLoading}
              classId={reForm.watch("class_id")}
              feeVariantId={reForm.watch("fee_variant_id")}
              notes={reForm.watch("notes")}
              onClassChange={(id) => reForm.setValue("class_id", id, { shouldValidate: true })}
              onFeeVariantChange={(id) => reForm.setValue("fee_variant_id", id)}
              onNotesChange={(val) => reForm.setValue("notes", val)}
              classError={reForm.formState.errors.class_id?.message}
            />
          )}

          {/* L'affectation decide du tarif : elle se saisit ici, avec la
              classe, et non apres coup sur une inscription deja creee. */}
          {enrollmentType === "new" ? (
            <Form {...newForm}>
              <AssignmentStatusField
                control={newForm.control}
                statusName="assignment_status"
                decisionName="assignment_decision_number"
                status={newForm.watch("assignment_status")}
                onDecisionCleared={() => newForm.setValue("assignment_decision_number", null)}
              />
            </Form>
          ) : (
            <Form {...reForm}>
              <AssignmentStatusField
                control={reForm.control}
                statusName="assignment_status"
                decisionName="assignment_decision_number"
                status={reForm.watch("assignment_status")}
                onDecisionCleared={() => reForm.setValue("assignment_decision_number", null)}
              />
            </Form>
          )}
        </div>
      )}

      {step === 3 && (
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
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={handlePrevious}
          disabled={step === 0 || isPending}
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Précédent
        </Button>

        {step < 3 ? (
          <Button
            type="button"
            className="h-11"
            onClick={handleNext}
            disabled={step === 0 && !enrollmentType}
          >
            Suivant
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            className="h-11"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {attachPhoto.isPending ? "Envoi de la photo..." : isPending ? "Enregistrement..." : "Enregistrer l'inscription"}
          </Button>
        )}
      </div>
    </div>
  )
}
