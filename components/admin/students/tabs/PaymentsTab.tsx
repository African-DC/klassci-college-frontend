"use client"

import { useState } from "react"
import Link from "next/link"
import { Wallet, Plus, GraduationCap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useEnrollments } from "@/lib/hooks/useEnrollments"
import { StudentPaymentModal } from "./StudentPaymentModal"

interface PaymentsTabProps {
  studentId: number
  fullData: Record<string, unknown>
}

function formatFCFA(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`
}

const STATUS_LABEL: Record<string, string> = {
  prospect: "Prospect",
  en_validation: "En validation",
  valide: "Validé",
  rejete: "Rejeté",
  annule: "Annulé",
}

export function PaymentsTab({ studentId, fullData }: PaymentsTabProps) {
  const [paymentOpen, setPaymentOpen] = useState(false)
  const { data: enrollmentsData, isLoading, isError, refetch } = useEnrollments({ student_id: studentId })
  const enrollments = enrollmentsData?.items ?? []

  const totalExpected = typeof fullData.fees_total === "number" ? fullData.fees_total : 0
  const totalPaid = typeof fullData.fees_paid === "number" ? fullData.fees_paid : 0
  const feesRate = typeof fullData.fees_rate === "number" ? fullData.fees_rate : (totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0)
  const feesRemaining = typeof fullData.fees_remaining === "number" ? fullData.fees_remaining : Math.max(0, totalExpected - totalPaid)

  if (isLoading) {
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
      {/* Hero section */}
      <Card className="border-0 shadow-sm ring-1 ring-border bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="grid gap-4 sm:grid-cols-2 flex-1">
              <div>
                <p className="text-xs text-primary-foreground/70">Total attendu</p>
                <p className="text-2xl font-bold">{formatFCFA(totalExpected as number)}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-primary-foreground/70">Total payé</p>
                <p className="text-2xl font-bold">{formatFCFA(totalPaid as number)}</p>
              </div>
            </div>
          </div>
          <Progress
            value={feesRate as number}
            className="h-2.5 bg-primary-foreground/20"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-primary-foreground/80">
              Reste à payer : <span className="font-semibold">{formatFCFA(feesRemaining as number)}</span>
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="text-xs"
              onClick={() => setPaymentOpen(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Enregistrer un paiement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments payment list */}
      <div className="grid gap-4 sm:grid-cols-2">
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
