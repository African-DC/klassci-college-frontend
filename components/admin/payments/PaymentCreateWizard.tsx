"use client"

import { useState, useMemo } from "react"
import { ArrowLeft, Search, User, BookOpen, Receipt, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useStudents, useStudentFees } from "@/lib/hooks/useStudents"
import { useEnrollments } from "@/lib/hooks/useEnrollments"
import { useCreatePayment } from "@/lib/hooks/usePayments"
import { useDebounce } from "@/lib/hooks/useDebounce"
import type { Student } from "@/lib/contracts/student"
import type { Enrollment } from "@/lib/contracts/enrollment"
import type { StudentEnrollmentFee } from "@/lib/api/students"
import type { PaymentMethod } from "@/lib/contracts/payment"

// --- Types internes ---

interface WizardState {
  step: 1 | 2 | 3 | 4
  student: Student | null
  enrollment: Enrollment | null
  fee: StudentEnrollmentFee | null
}

const STEP_LABELS = [
  "Rechercher un eleve",
  "Selectionner l'inscription",
  "Choisir le frais",
  "Saisir le paiement",
] as const

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Especes" },
  { value: "check", label: "Cheque" },
  { value: "bank_transfer", label: "Virement bancaire" },
  { value: "mobile_money", label: "Mobile Money" },
]

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`
}

// --- Composant principal ---

interface PaymentCreateWizardProps {
  open: boolean
  onClose: () => void
}

export function PaymentCreateWizard({ open, onClose }: PaymentCreateWizardProps) {
  const [wizard, setWizard] = useState<WizardState>({
    step: 1,
    student: null,
    enrollment: null,
    fee: null,
  })

  function reset() {
    setWizard({ step: 1, student: null, enrollment: null, fee: null })
  }

  function handleClose() {
    reset()
    onClose()
  }

  function goBack() {
    if (wizard.step === 1) return
    setWizard((prev) => ({
      ...prev,
      step: (prev.step - 1) as WizardState["step"],
      ...(prev.step === 2 && { student: null }),
      ...(prev.step === 3 && { enrollment: null }),
      ...(prev.step === 4 && { fee: null }),
    }))
  }

  function selectStudent(student: Student) {
    setWizard((prev) => ({ ...prev, step: 2, student }))
  }

  function selectEnrollment(enrollment: Enrollment) {
    setWizard((prev) => ({ ...prev, step: 3, enrollment }))
  }

  function selectFee(fee: StudentEnrollmentFee) {
    setWizard((prev) => ({ ...prev, step: 4, fee }))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau paiement</DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <StepProgress currentStep={wizard.step} />

        {/* Back button (steps 2-4) */}
        {wizard.step > 1 && (
          <Button variant="ghost" size="sm" onClick={goBack} className="w-fit gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        )}

        {/* Steps */}
        {wizard.step === 1 && <StepSearchStudent onSelect={selectStudent} />}
        {wizard.step === 2 && wizard.student && (
          <StepSelectEnrollment student={wizard.student} onSelect={selectEnrollment} />
        )}
        {wizard.step === 3 && wizard.student && (
          <StepSelectFee student={wizard.student} onSelect={selectFee} />
        )}
        {wizard.step === 4 && wizard.fee && (
          <StepPaymentForm fee={wizard.fee} onSuccess={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}

// --- Step Progress ---

function StepProgress({ currentStep }: { currentStep: number }) {
  const progress = (currentStep / 4) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Etape {currentStep} sur 4
        </span>
        <span className="font-medium">{STEP_LABELS[currentStep - 1]}</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1
          const isDone = currentStep > stepNum
          const isCurrent = currentStep === stepNum
          return (
            <div
              key={label}
              className={`flex items-center gap-1 text-xs ${
                isCurrent
                  ? "text-primary font-medium"
                  : isDone
                    ? "text-emerald-600"
                    : "text-muted-foreground"
              }`}
            >
              {isDone ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]">
                  {stepNum}
                </span>
              )}
              <span className="hidden sm:inline">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Step 1: Search student ---

function StepSearchStudent({ onSelect }: { onSelect: (s: Student) => void }) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useStudents(
    debouncedSearch.length >= 2 ? { search: debouncedSearch } : {},
  )

  const students = useMemo(() => data?.items ?? [], [data])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un eleve (nom, prenom, matricule)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          autoFocus
        />
      </div>

      {search.length > 0 && search.length < 2 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Saisissez au moins 2 caracteres pour rechercher
        </p>
      )}

      {isLoading && debouncedSearch.length >= 2 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && debouncedSearch.length >= 2 && students.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucun eleve trouve pour &laquo;{debouncedSearch}&raquo;
        </p>
      )}

      {students.length > 0 && (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {students.map((student) => (
            <Card
              key={student.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => onSelect(student)}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {student.first_name[0]}{student.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {student.last_name} {student.first_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {student.enrollment_number
                      ? `Matricule : ${student.enrollment_number}`
                      : "Pas de matricule"}
                    {student.genre && ` - ${student.genre === "M" ? "Garcon" : "Fille"}`}
                  </p>
                </div>
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Step 2: Select enrollment ---

function StepSelectEnrollment({
  student,
  onSelect,
}: {
  student: Student
  onSelect: (e: Enrollment) => void
}) {
  const { data, isLoading } = useEnrollments({ student_id: student.id })
  const enrollments = useMemo(() => data?.items ?? [], [data])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-sm text-muted-foreground">Eleve selectionne</p>
        <p className="font-medium">{student.last_name} {student.first_name}</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && enrollments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucune inscription trouvee pour cet eleve.
        </p>
      )}

      {enrollments.length > 0 && (
        <div className="space-y-2">
          {enrollments.map((enrollment) => (
            <Card
              key={enrollment.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => onSelect(enrollment)}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {enrollment.class_name ?? `Classe #${enrollment.class_id}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {enrollment.academic_year_name}
                  </p>
                </div>
                <Badge
                  variant={enrollment.status === "valide" ? "default" : "secondary"}
                >
                  {enrollment.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Step 3: Select fee ---

function StepSelectFee({
  student,
  onSelect,
}: {
  student: Student
  onSelect: (f: StudentEnrollmentFee) => void
}) {
  const { data: fees, isLoading } = useStudentFees(student.id)
  const feeList = useMemo(() => {
    if (!fees) return []
    return Array.isArray(fees) ? fees : []
  }, [fees])

  const unpaidFees = useMemo(
    () => feeList.filter((f) => f.remaining > 0),
    [feeList],
  )

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && unpaidFees.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Tous les frais sont deja payes pour cet eleve.
        </p>
      )}

      {unpaidFees.length > 0 && (
        <div className="space-y-2">
          {unpaidFees.map((fee) => {
            const paidPercent =
              fee.amount > 0 ? Math.round((fee.paid / fee.amount) * 100) : 0

            return (
              <Card
                key={fee.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => onSelect(fee)}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{fee.category_name}</span>
                    </div>
                    <Badge variant={paidPercent >= 50 ? "default" : "secondary"}>
                      {paidPercent}% paye
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-medium">{formatCurrency(fee.amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Paye</p>
                      <p className="font-medium text-emerald-600">
                        {formatCurrency(fee.paid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Restant</p>
                      <p className="font-medium text-orange-600">
                        {formatCurrency(fee.remaining)}
                      </p>
                    </div>
                  </div>
                  <Progress value={paidPercent} className="h-1.5" />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- Step 4: Payment form ---

function StepPaymentForm({
  fee,
  onSuccess,
}: {
  fee: StudentEnrollmentFee
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState(String(fee.remaining))
  const [method, setMethod] = useState<PaymentMethod>("cash")
  const [reference, setReference] = useState("")
  const { mutate, isPending } = useCreatePayment()

  const numericAmount = Number(amount)
  const isAmountValid =
    !Number.isNaN(numericAmount) && numericAmount > 0 && numericAmount <= fee.remaining

  function handleSubmit() {
    if (!isAmountValid) return

    mutate(
      {
        enrollment_fee_id: fee.id,
        amount: amount,
        method,
        reference: reference || null,
      },
      { onSuccess },
    )
  }

  return (
    <div className="space-y-4">
      {/* Fee summary */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Frais selectionne
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-medium">{fee.category_name}</p>
          <div className="flex items-center gap-4 text-sm">
            <span>Total : {formatCurrency(fee.amount)}</span>
            <span className="text-emerald-600">
              Paye : {formatCurrency(fee.paid)}
            </span>
            <span className="text-orange-600 font-medium">
              Restant : {formatCurrency(fee.remaining)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Amount */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Montant (FCFA) *</label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Montant a payer"
          min={1}
          max={fee.remaining}
        />
        {amount && !isAmountValid && (
          <p className="text-xs text-destructive">
            Le montant doit etre entre 1 et {formatCurrency(fee.remaining)}
          </p>
        )}
      </div>

      {/* Method */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Methode de paiement *</label>
        <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reference */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Reference</label>
        <Input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Numero de transaction (optionnel)"
        />
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={isPending || !isAmountValid}
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          `Enregistrer le paiement de ${isAmountValid ? formatCurrency(numericAmount) : "..."}`
        )}
      </Button>
    </div>
  )
}
