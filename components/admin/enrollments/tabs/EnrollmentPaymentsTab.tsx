"use client"

import { Wallet, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface EnrollmentPaymentsTabProps {
  enrollmentId: number
}

function formatFCFA(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`
}

export function EnrollmentPaymentsTab({ enrollmentId: _enrollmentId }: EnrollmentPaymentsTabProps) {
  // Placeholder values until fees data is available from this endpoint
  const totalExpected = 0
  const totalPaid = 0
  const feesRate = 0

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
              <p className="text-xs text-primary-foreground/70">Total pay&eacute;</p>
              <p className="text-2xl font-bold">{formatFCFA(totalPaid)}</p>
            </div>
          </div>
          <Progress
            value={feesRate}
            className="h-2.5 bg-primary-foreground/20"
          />
        </CardContent>
      </Card>

      {/* Placeholder message */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Info className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Paiements</p>
              <p className="text-sm text-muted-foreground mt-1">
                Les d&eacute;tails de paiement par frais seront disponibles prochainement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
