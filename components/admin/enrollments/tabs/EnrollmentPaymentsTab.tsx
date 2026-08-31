"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getSession } from "next-auth/react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { enrollmentsApi } from "@/lib/api/enrollments"
import { isCashDue } from "@/lib/contracts/payment"
import { Skeleton } from "@/components/ui/skeleton"
import { FeeSummaryHero } from "@/components/shared/fees/FeeSummaryHero"
import { EnrollmentFeesBreakdown, type EnrollmentFeeItem } from "@/components/admin/payments/EnrollmentFeesBreakdown"
import { PaymentHistoryList } from "@/components/admin/payments/PaymentHistoryList"
import { StudentPaymentModal } from "@/components/admin/students/tabs/StudentPaymentModal"
import { EnrollmentScheduleCard } from "@/components/admin/installments/EnrollmentScheduleCard"

interface EnrollmentPaymentsTabProps {
  enrollmentId: number
  enrollment?: { student_id?: number }
}

export function EnrollmentPaymentsTab({ enrollmentId, enrollment }: EnrollmentPaymentsTabProps) {
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [markingFeeId, setMarkingFeeId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const studentId = (enrollment as Record<string, unknown>)?.student_id as number | undefined

  const { data: fees, isLoading } = useQuery({
    queryKey: ["enrollment-fees", enrollmentId],
    queryFn: async (): Promise<EnrollmentFeeItem[]> => {
      if (!studentId) return []
      const session = await getSession()
      const baseUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${baseUrl}/admin/students/${studentId}/fees`, {
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
      })
      if (!res.ok) return []
      const data = await res.json()
      const items: (EnrollmentFeeItem & { enrollment_id: number })[] = Array.isArray(data) ? data : data.items ?? []
      return items.filter((f) => f.enrollment_id === enrollmentId)
    },
    enabled: !!studentId,
    staleTime: 1000 * 60 * 2,
  })

  const feeList = fees ?? []
  const totalExpected = feeList.filter((f) => isCashDue(f.status)).reduce((s, f) => s + f.amount, 0)
  const totalPaid = feeList.filter((f) => isCashDue(f.status)).reduce((s, f) => s + f.paid, 0)
  const totalRemaining = Math.max(0, totalExpected - totalPaid)

  async function handleMarkDeposited(feeId: number) {
    setMarkingFeeId(feeId)
    try {
      await enrollmentsApi.depositInKind(enrollmentId, feeId)
      toast.success("Article marqué déposé")
      queryClient.invalidateQueries({ queryKey: ["enrollment-fees", enrollmentId] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de marquer ce frais déposé")
    } finally {
      setMarkingFeeId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FeeSummaryHero totalExpected={totalExpected} totalPaid={totalPaid} totalRemaining={totalRemaining} />

      {/* Placé juste sous la synthèse : « combien reste-t-il ? » appelle
          immédiatement « et pour quand ? ». Le retard affiché compare ce qui
          est déjà exigible au versé, jamais le total de l'année. */}
      <EnrollmentScheduleCard enrollmentId={enrollmentId} />

      {studentId && totalRemaining > 0 && (
        <div className="flex justify-end">
          <Button onClick={() => setPaymentOpen(true)} className="h-11 sm:h-10">
            <Plus className="mr-1.5 h-4 w-4" />
            Enregistrer un paiement
          </Button>
        </div>
      )}

      <EnrollmentFeesBreakdown
        fees={feeList}
        onMarkDeposited={handleMarkDeposited}
        markingFeeId={markingFeeId}
      />

      <PaymentHistoryList enrollmentId={enrollmentId} />

      {studentId && (
        <StudentPaymentModal
          studentId={studentId}
          open={paymentOpen}
          onClose={() => {
            setPaymentOpen(false)
            queryClient.invalidateQueries({ queryKey: ["enrollment-fees", enrollmentId] })
            queryClient.invalidateQueries({ queryKey: ["payments", "enrollment", enrollmentId] })
          }}
        />
      )}
    </div>
  )
}
