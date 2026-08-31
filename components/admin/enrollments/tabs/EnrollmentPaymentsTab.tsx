"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { enrollmentsApi } from "@/lib/api/enrollments"
import { useStudentFees } from "@/lib/hooks/useStudents"
import { isCashDue } from "@/lib/contracts/payment"
import { countFeeLines } from "@/lib/enrollment/fee-lines"
import { FeeSummaryHero } from "@/components/shared/fees/FeeSummaryHero"
import { RegenerateFeesAction } from "@/components/shared/fees/RegenerateFeesAction"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { EnrollmentFeesBreakdown, type EnrollmentFeeItem } from "@/components/admin/payments/EnrollmentFeesBreakdown"
import { PaymentHistoryList } from "@/components/admin/payments/PaymentHistoryList"
import { StudentPaymentModal } from "@/components/admin/students/tabs/StudentPaymentModal"
import { EnrollmentScheduleCard } from "@/components/admin/installments/EnrollmentScheduleCard"
import { installmentKeys } from "@/lib/hooks/useInstallments"

interface EnrollmentPaymentsTabProps {
  enrollmentId: number
  enrollment?: { student_id?: number }
  /** Nommé dans les confirmations : on solde le frais d'un élève, pas d'un numéro. */
  studentName?: string
}

export function EnrollmentPaymentsTab({
  enrollmentId,
  enrollment,
  studentName,
}: EnrollmentPaymentsTabProps) {
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [feeToDeposit, setFeeToDeposit] = useState<EnrollmentFeeItem | null>(null)
  const queryClient = useQueryClient()
  const studentId = enrollment?.student_id

  // Le même appel validé que la fiche élève, filtré sur cette inscription :
  // deux écrans qui lisent les mêmes frais ne doivent pas les chercher de deux
  // façons différentes, ni afficher deux totaux.
  const { data: allFees, isLoading } = useStudentFees(studentId ?? 0)
  const feeList = useMemo(
    () => (allFees ?? []).filter((fee) => fee.enrollment_id === enrollmentId),
    [allFees, enrollmentId],
  )

  const cashFees = feeList.filter((f) => isCashDue(f.status))
  const totalExpected = cashFees.reduce((s, f) => s + f.amount, 0)
  const totalPaid = cashFees.reduce((s, f) => s + f.paid, 0)
  const totalRemaining = Math.max(0, totalExpected - totalPaid)
  // Le décompte n'est pas « payé ou non » : une ligne exonérée ou déposée en
  // nature est soldée sans versement, et ne se range dans aucune des deux
  // colonnes que la confirmation annonce.
  const feeLines = useMemo(() => countFeeLines(feeList), [feeList])

  const depositMutation = useMutation({
    mutationFn: (feeId: number) => enrollmentsApi.depositInKind(enrollmentId, feeId),
    onSuccess: () => {
      toast.success("Article marqué déposé")
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      // L'échéancier rendu juste au-dessus dérive des frais : total dû, déjà
      // versé, et le bandeau « En retard de X F ». Sans cette invalidation il
      // garde jusqu'à une minute le retard calculé sur la ligne qu'on vient
      // de solder, et l'écran contredit l'action qu'il vient de confirmer.
      queryClient.invalidateQueries({ queryKey: installmentKeys.schedule(enrollmentId) })
    },
    onError: (err: Error) => {
      toast.error("Impossible de marquer ce frais déposé", { description: err.message })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    )
  }

  const articleName = feeToDeposit ? feeToDeposit.option_name ?? feeToDeposit.category_name : ""
  const eleve = studentName?.trim() ? studentName : "cet élève"

  return (
    <div className="space-y-4">
      <FeeSummaryHero totalExpected={totalExpected} totalPaid={totalPaid} totalRemaining={totalRemaining} />

      {/* Placé juste sous la synthèse : « combien reste-t-il ? » appelle
          immédiatement « et pour quand ? ». Le retard affiché compare ce qui
          est déjà exigible au versé, jamais le total de l'année. */}
      <EnrollmentScheduleCard enrollmentId={enrollmentId} />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <RegenerateFeesAction
          enrollmentIds={[enrollmentId]}
          subject={`${eleve}, pour cette inscription`}
          feeLines={feeLines}
        />
        {studentId && totalRemaining > 0 ? (
          <Button onClick={() => setPaymentOpen(true)} className="h-11 w-full sm:h-10 sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            Enregistrer un paiement
          </Button>
        ) : null}
      </div>

      <EnrollmentFeesBreakdown
        fees={feeList}
        onMarkDeposited={setFeeToDeposit}
        markingFeeId={depositMutation.isPending ? feeToDeposit?.id ?? null : null}
      />

      <PaymentHistoryList enrollmentId={enrollmentId} />

      <ConfirmActionDialog
        open={!!feeToDeposit}
        onOpenChange={(next) => {
          if (!next && !depositMutation.isPending) setFeeToDeposit(null)
        }}
        tone="warning"
        title="Marquer cet article comme déposé ?"
        description={`Vous déclarez que ${eleve} a bien remis « ${articleName} ». Cette ligne sera soldée sans aucun versement : c'est ce geste qui remplace le paiement.`}
        details={
          <>
            <p>
              Article : <span className="font-semibold">{articleName}</span>
            </p>
            <p className="text-muted-foreground">
              La ligne sort du reste à payer et n&apos;apparaît plus comme impayée, ni ici ni
              dans le portail de la famille. Aucun reçu de caisse n&apos;est émis.
            </p>
          </>
        }
        confirmLabel="Oui, l'article est déposé"
        pendingLabel="Enregistrement..."
        pending={depositMutation.isPending}
        onConfirm={() => {
          if (!feeToDeposit) return
          depositMutation.mutate(feeToDeposit.id, { onSettled: () => setFeeToDeposit(null) })
        }}
      />

      {studentId && (
        <StudentPaymentModal
          studentId={studentId}
          open={paymentOpen}
          onClose={() => {
            setPaymentOpen(false)
            queryClient.invalidateQueries({ queryKey: ["students"] })
            queryClient.invalidateQueries({ queryKey: ["payments", "enrollment", enrollmentId] })
          }}
        />
      )}
    </div>
  )
}
