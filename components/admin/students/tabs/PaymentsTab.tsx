"use client"

import { useState } from "react"
import Link from "next/link"
import { Wallet, Plus, GraduationCap, RefreshCw } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { getSession } from "next-auth/react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useEnrollments, enrollmentKeys } from "@/lib/hooks/useEnrollments"
import { studentKeys, useStudentFees } from "@/lib/hooks/useStudents"
import { StudentPaymentModal } from "./StudentPaymentModal"

interface PaymentsTabProps {
  studentId: number
  fullData?: Record<string, unknown>
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

export function PaymentsTab({ studentId }: PaymentsTabProps) {
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const queryClient = useQueryClient()
  const { data: enrollmentsData, isLoading, isError, refetch } = useEnrollments({ student_id: studentId })
  const { data: fees } = useStudentFees(studentId)
  const enrollments = enrollmentsData?.items ?? []

  // Compute totals from actual enrollment fees (not stale fullData)
  const totalExpected = (fees ?? []).reduce((sum, f) => sum + f.amount, 0)
  const totalPaid = (fees ?? []).reduce((sum, f) => sum + f.paid, 0)
  const feesRemaining = Math.max(0, totalExpected - totalPaid)
  const feesRate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0

  async function handleRegenerateFees() {
    if (enrollments.length === 0) return
    setRegenerating(true)
    try {
      const session = await getSession()
      const baseUrl = process.env.NEXT_PUBLIC_API_URL
      await Promise.all(
        enrollments.map((enrollment) =>
          fetch(`${baseUrl}/admin/enrollments/${enrollment.id}/regenerate-fees`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
            },
          }).then((res) => {
            if (!res.ok) throw new Error(`Erreur pour l'inscription #${enrollment.id}`)
          })
        )
      )
      queryClient.invalidateQueries({ queryKey: studentKeys.all })
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(studentId) })
      queryClient.invalidateQueries({ queryKey: ["students", studentId, "fees"] })
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
      toast.success("Frais régénérés avec succès")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de la régénération des frais"
      toast.error(message)
    } finally {
      setRegenerating(false)
    }
  }

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
            value={feesRate}
            className="h-3 bg-primary-foreground/20 [&>div]:bg-primary-foreground"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-primary-foreground/80">
              Reste à payer : <span className="font-semibold">{formatFCFA(feesRemaining as number)}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10 border border-primary-foreground/30"
                onClick={handleRegenerateFees}
                disabled={regenerating}
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
                {regenerating ? "Régénération..." : "Régénérer les frais"}
              </Button>
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
