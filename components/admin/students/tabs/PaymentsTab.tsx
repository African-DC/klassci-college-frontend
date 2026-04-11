"use client"

import { Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useEnrollments } from "@/lib/hooks/useEnrollments"

interface PaymentsTabProps {
  studentId: number
  fullData: Record<string, unknown>
}

function formatFCFA(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`
}

export function PaymentsTab({ studentId, fullData }: PaymentsTabProps) {
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
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div>
              <p className="text-xs text-primary-foreground/70">Total attendu</p>
              <p className="text-2xl font-bold">{formatFCFA(totalExpected as number)}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-primary-foreground/70">Total paye</p>
              <p className="text-2xl font-bold">{formatFCFA(totalPaid as number)}</p>
            </div>
          </div>
          <Progress
            value={feesRate as number}
            className="h-2.5 bg-primary-foreground/20"
          />
          <p className="mt-2 text-sm text-primary-foreground/80">
            Reste a payer : <span className="font-semibold">{formatFCFA(feesRemaining as number)}</span>
          </p>
        </CardContent>
      </Card>

      {/* Enrollments payment list */}
      <div className="space-y-3">
        {enrollments.map((enrollment) => {
          const e = enrollment as Record<string, unknown>
          const status = String(e.status ?? "")
          const statusLabel: Record<string, string> = {
            prospect: "Prospect",
            en_validation: "En validation",
            valide: "Valide",
            rejete: "Rejete",
            annule: "Annule",
          }

          return (
            <Card key={enrollment.id} className="border-0 shadow-sm ring-1 ring-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {e.class_name ? String(e.class_name) : "Classe"} — {e.academic_year_name ? String(e.academic_year_name) : "Annee"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {statusLabel[status] ?? status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Les details de paiement sont consultables depuis la fiche d&apos;inscription.
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
