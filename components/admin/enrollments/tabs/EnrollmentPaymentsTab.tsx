"use client"

import { useQuery } from "@tanstack/react-query"
import { getSession } from "next-auth/react"
import { Wallet, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

interface EnrollmentPaymentsTabProps {
  enrollmentId: number
  enrollment?: { student_id?: number }
}

interface EnrollmentFeeItem {
  id: number
  enrollment_id: number
  category_name: string
  amount: number
  paid: number
  remaining: number
  status: string
  is_optional?: boolean
  option_name?: string | null
}

function formatFCFA(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`
}

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  partial: { label: "Partiel", variant: "outline" },
  paid: { label: "Payé", variant: "default" },
  waived: { label: "Exonéré", variant: "secondary" },
}

export function EnrollmentPaymentsTab({ enrollmentId, enrollment }: EnrollmentPaymentsTabProps) {
  const studentId = (enrollment as Record<string, unknown>)?.student_id as number | undefined

  const { data: fees, isLoading } = useQuery({
    queryKey: ["enrollment-fees", enrollmentId],
    queryFn: async () => {
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
      const items: EnrollmentFeeItem[] = Array.isArray(data) ? data : data.items ?? []
      // Filter to only this enrollment's fees
      return items.filter((f) => f.enrollment_id === enrollmentId)
    },
    enabled: !!studentId,
    staleTime: 1000 * 60 * 2,
  })

  const totalExpected = (fees ?? []).reduce((s, f) => s + f.amount, 0)
  const totalPaid = (fees ?? []).reduce((s, f) => s + f.paid, 0)
  const feesRemaining = Math.max(0, totalExpected - totalPaid)
  const feesRate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
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
              <p className="text-2xl font-bold">{formatFCFA(totalExpected)}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-primary-foreground/70">Total payé</p>
              <p className="text-2xl font-bold">{formatFCFA(totalPaid)}</p>
            </div>
          </div>
          <Progress
            value={feesRate}
            className="h-3 bg-primary-foreground/20 [&>div]:bg-primary-foreground"
          />
          <p className="mt-2 text-sm text-primary-foreground/80">
            Reste à payer : <span className="font-semibold">{formatFCFA(feesRemaining)}</span>
          </p>
        </CardContent>
      </Card>

      {/* Fee details */}
      {(fees ?? []).length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {(fees ?? []).map((fee) => {
            const st = STATUS_LABEL[fee.status] ?? { label: fee.status, variant: "outline" as const }
            return (
              <Card key={fee.id} className="border-0 shadow-sm ring-1 ring-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {fee.option_name ?? fee.category_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFCFA(fee.paid)} / {formatFCFA(fee.amount)}
                      </p>
                    </div>
                    <Badge variant={st.variant} className="text-[10px] shrink-0">
                      {st.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-3">
            <Wallet className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Aucun frais associé à cette inscription.</p>
        </div>
      )}
    </div>
  )
}
