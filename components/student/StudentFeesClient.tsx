"use client"

import { CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FeeSummaryHero } from "@/components/shared/fees/FeeSummaryHero"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useStudentFees } from "@/lib/hooks/useStudentPortal"
import { DataError } from "@/components/shared/DataError"
import type { StudentFeeItem } from "@/lib/contracts/student-portal"

const STATUS_CONFIG: Record<StudentFeeItem["status"], { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof CheckCircle }> = {
  paye: { label: "Payé", variant: "default", icon: CheckCircle },
  partiel: { label: "Partiel", variant: "secondary", icon: Clock },
  impaye: { label: "Impayé", variant: "destructive", icon: AlertCircle },
}

export function StudentFeesClient() {
  const { data, isLoading, isError, refetch } = useStudentFees()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl tracking-tight">Frais scolaires</h1>
        <p className="text-sm text-muted-foreground">Suivi de vos paiements</p>
      </div>

      {isLoading ? (
        <FeesSkeleton />
      ) : isError ? (
        <DataError message="Impossible de charger les frais scolaires." onRetry={() => refetch()} />
      ) : !data ? (
        <div className="rounded-lg border bg-muted/30 py-12 text-center">
          <p className="text-sm text-muted-foreground">Aucune information de frais disponible.</p>
          <p className="mt-1 text-xs text-muted-foreground/80">
            Si votre inscription est validée et qu&apos;aucun frais n&apos;apparaît, contactez le secrétariat.
          </p>
        </div>
      ) : (
        <>
          {/* Synthèse aux couleurs KLASSCI. Neutralisé si rien à payer
              (cf. rule not-enrolled-empty-state). */}
          <FeeSummaryHero
            totalExpected={data.total_expected}
            totalPaid={data.total_paid}
            totalRemaining={data.total_remaining}
          />

          {/* Détail par catégorie */}
          {data.fees.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun frais enregistré.
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.fees.map((fee) => {
                    const config = STATUS_CONFIG[fee.status]
                    return (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium text-sm">{fee.category_name}</TableCell>
                        <TableCell className="text-right text-sm">
                          {fee.total_amount.toLocaleString("fr-FR")} FCFA
                        </TableCell>
                        <TableCell className="text-right text-sm text-emerald-600 dark:text-emerald-400">
                          {fee.paid_amount.toLocaleString("fr-FR")} FCFA
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="text-[10px]">
                            {config.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FeesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}
