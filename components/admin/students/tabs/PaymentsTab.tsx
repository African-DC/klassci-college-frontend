"use client"

import { useState } from "react"
import Link from "next/link"
import { Wallet, Plus, GraduationCap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { FeeSummaryHero } from "@/components/shared/fees/FeeSummaryHero"
import { RegenerateFeesAction } from "@/components/shared/fees/RegenerateFeesAction"
import { useEnrollments } from "@/lib/hooks/useEnrollments"
import { useStudentFees } from "@/lib/hooks/useStudents"
import { isCashDue } from "@/lib/contracts/payment"
import { countFeeLines } from "@/lib/enrollment/fee-lines"
import { StudentPaymentModal } from "./StudentPaymentModal"

interface PaymentsTabProps {
  studentId: number
  /** Nommé dans la confirmation de régénération : on refait les frais de quelqu'un. */
  studentName?: string
  fullData?: Record<string, unknown>
}

const STATUS_LABEL: Record<string, string> = {
  prospect: "Prospect",
  en_validation: "En validation",
  valide: "Validé",
  rejete: "Rejeté",
  annule: "Annulé",
}

export function PaymentsTab({ studentId, studentName }: PaymentsTabProps) {
  const [paymentOpen, setPaymentOpen] = useState(false)
  const { data: enrollmentsData, isLoading, isError, refetch } = useEnrollments({ student_id: studentId })
  const { data: fees, isLoading: feesLoading } = useStudentFees(studentId)
  const enrollments = enrollmentsData?.items ?? []

  // Compute totals from actual enrollment fees (not stale fullData)
  const dueFees = (fees ?? []).filter((f) => isCashDue(f.status))
  const totalExpected = dueFees.reduce((sum, f) => sum + f.amount, 0)
  const totalPaid = dueFees.reduce((sum, f) => sum + f.paid, 0)
  const feesRemaining = Math.max(0, totalExpected - totalPaid)

  // Tant que les frais ne sont pas là, on ne chiffre rien : un tableau vide
  // vaut zéro, et zéro s'affiche comme une certitude que l'on n'a pas.
  const feeLines = fees ? countFeeLines(fees) : undefined

  if (isLoading || feesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    )
  }

  if (isError) return <DataError message="Impossible de charger les paiements." onRetry={() => refetch()} />

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-3">
          <Wallet className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Aucune inscription, donc aucun paiement.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FeeSummaryHero totalExpected={totalExpected} totalPaid={totalPaid} totalRemaining={feesRemaining} />

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <RegenerateFeesAction
          enrollmentIds={enrollments.map((e) => e.id)}
          subject={studentName?.trim() ? studentName : "cet élève"}
          feeLines={feeLines}
        />
        <Button
          size="sm"
          className="h-11 w-full sm:h-10 sm:w-auto"
          onClick={() => setPaymentOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Enregistrer un paiement
        </Button>
      </div>

      {/* Détail par inscription — lien vers la fiche paiement complète */}
      <div className="grid gap-3 sm:grid-cols-2">
        {enrollments.map((enrollment) => {
          const e = enrollment as Record<string, unknown>
          const status = String(e.status ?? "")

          return (
            <Link key={enrollment.id} href={`/admin/enrollments/${enrollment.id}`}>
              <Card className="border-0 shadow-sm ring-1 ring-border cursor-pointer hover:ring-primary/40 hover:shadow-md transition-all h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-sm font-semibold truncate">
                          {e.class_name ? String(e.class_name) : "Classe"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {e.academic_year_name ? String(e.academic_year_name) : "Année"}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">
                        Voir les détails de paiement
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {STATUS_LABEL[status] ?? status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <StudentPaymentModal
        studentId={studentId}
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
      />
    </div>
  )
}
