"use client"

import { CreditCard, GraduationCap, UserPlus } from "lucide-react"
import type { NewEnrollment, ReEnrollment, FeeVariantOption } from "@/lib/contracts/enrollment"
import type { Student } from "@/lib/contracts/student"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const RELATIONSHIP_TYPES = [
  { value: "father", label: "Père" },
  { value: "mother", label: "Mère" },
  { value: "guardian", label: "Tuteur" },
  { value: "other", label: "Autre" },
] as const

function formatXof(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(amount)
}

interface EnrollmentSummaryStepProps {
  enrollmentType: "new" | "re-enrollment"
  newValues: NewEnrollment
  reValues: ReEnrollment
  selectedStudent?: Student
  selectedClassName: string
  watchedClassId?: number
  feeVariants: FeeVariantOption[]
  selectedFeeVariant?: FeeVariantOption
  photo: File | null
  showParentFields: boolean
  createError?: string
  reEnrollError?: string
}

export function EnrollmentSummaryStep({
  enrollmentType,
  newValues,
  reValues,
  selectedStudent,
  selectedClassName,
  watchedClassId,
  feeVariants,
  selectedFeeVariant,
  photo,
  showParentFields,
  createError,
  reEnrollError,
}: EnrollmentSummaryStepProps) {
  const mandatory = feeVariants.filter((variant) => variant.is_mandatory !== false)
  const optionalAmount =
    selectedFeeVariant && selectedFeeVariant.is_mandatory === false ? Number(selectedFeeVariant.amount) : 0
  const total = mandatory.reduce((sum, variant) => sum + Number(variant.amount), 0) + optionalAmount
  const notes = enrollmentType === "new" ? newValues.notes : reValues.notes

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Vérifiez les informations avant de valider.</p>
      <Card>
        <CardContent className="space-y-4 pb-4 pt-4">
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
              <UserPlus className="h-4 w-4" />
              Élève
            </h4>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {enrollmentType === "new" ? (
                <>
                  <dt className="text-muted-foreground">Nom</dt>
                  <dd className="font-medium">
                    {newValues.first_name} {newValues.last_name}
                  </dd>
                  <dt className="text-muted-foreground">Photo</dt>
                  <dd>{photo ? "Prête à enregistrer" : "Non fournie"}</dd>
                  {newValues.birth_date ? (
                    <>
                      <dt className="text-muted-foreground">Date de naissance</dt>
                      <dd>{newValues.birth_date}</dd>
                    </>
                  ) : null}
                  {newValues.birth_place ? (
                    <>
                      <dt className="text-muted-foreground">Lieu de naissance</dt>
                      <dd>{newValues.birth_place}</dd>
                    </>
                  ) : null}
                  {newValues.genre ? (
                    <>
                      <dt className="text-muted-foreground">Genre</dt>
                      <dd>{newValues.genre === "M" ? "Masculin" : "Féminin"}</dd>
                    </>
                  ) : null}
                  {newValues.enrollment_number ? (
                    <>
                      <dt className="text-muted-foreground">Matricule</dt>
                      <dd>{newValues.enrollment_number}</dd>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <dt className="text-muted-foreground">Nom</dt>
                  <dd className="font-medium">
                    {selectedStudent
                      ? `${selectedStudent.first_name} ${selectedStudent.last_name}`
                      : `#${reValues.student_id}`}
                  </dd>
                </>
              )}
            </dl>
          </div>

          {enrollmentType === "new" && showParentFields && newValues.parent ? (
            <>
              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-semibold text-primary">Parent</h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Nom</dt>
                  <dd>
                    {newValues.parent.first_name} {newValues.parent.last_name}
                  </dd>
                  {newValues.parent.phone ? (
                    <>
                      <dt className="text-muted-foreground">Téléphone</dt>
                      <dd>{newValues.parent.phone}</dd>
                    </>
                  ) : null}
                  {newValues.parent.email ? (
                    <>
                      <dt className="text-muted-foreground">Email</dt>
                      <dd>{newValues.parent.email}</dd>
                    </>
                  ) : null}
                  <dt className="text-muted-foreground">Lien</dt>
                  <dd>
                    {RELATIONSHIP_TYPES.find((item) => item.value === newValues.parent?.relationship_type)?.label ?? "Tuteur"}
                  </dd>
                </dl>
              </div>
            </>
          ) : null}

          <Separator />

          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
              <GraduationCap className="h-4 w-4" />
              Classe
            </h4>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Classe</dt>
              <dd className="font-medium">{selectedClassName || `#${watchedClassId}`}</dd>
            </dl>
          </div>

          {feeVariants.length > 0 ? (
            <>
              <Separator />
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                  <CreditCard className="h-4 w-4" />
                  Frais
                </h4>
                {mandatory.map((variant) => (
                  <div key={variant.id} className="flex justify-between py-0.5 text-sm">
                    <span className="text-muted-foreground">{variant.category_name ?? "Frais"}</span>
                    <span className="font-mono">{formatXof(Number(variant.amount))}</span>
                  </div>
                ))}
                {selectedFeeVariant && selectedFeeVariant.is_mandatory === false ? (
                  <div className="flex justify-between py-0.5 text-sm">
                    <span className="text-muted-foreground">{selectedFeeVariant.category_name ?? "Option"}</span>
                    <span className="font-mono">{formatXof(Number(selectedFeeVariant.amount))}</span>
                  </div>
                ) : null}
                <div className="mt-1 flex justify-between border-t border-border/50 pt-1 text-sm">
                  <span className="font-semibold">Total</span>
                  <span className="font-mono font-bold text-primary">{formatXof(total)}</span>
                </div>
              </div>
            </>
          ) : null}

          {notes ? (
            <>
              <Separator />
              <div>
                <h4 className="mb-1 text-sm font-semibold text-muted-foreground">Notes</h4>
                <p className="text-sm">{notes}</p>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {createError || reEnrollError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{createError || reEnrollError}</p>
        </div>
      ) : null}
    </div>
  )
}
