"use client"

import { ArrowLeft, CheckCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataError } from "@/components/shared/DataError"
import { useParentChildFees } from "@/lib/hooks/useParentPortal"
import type { ParentChildFeeItem } from "@/lib/contracts/parent-portal"

const STATUS_CONFIG: Record<ParentChildFeeItem["status"], { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof CheckCircle }> = {
  paye: { label: "Payé", variant: "default", icon: CheckCircle },
  partiel: { label: "Partiel", variant: "secondary", icon: Clock },
  impaye: { label: "Impayé", variant: "destructive", icon: AlertCircle },
}

interface ParentChildFeesClientProps {
  childId: number
}

export function ParentChildFeesClient({ childId }: ParentChildFeesClientProps) {
  const { data, isLoading, isError, refetch } = useParentChildFees(childId)

  return (
    <div className="space-y-6">
      {/* En-tête avec retour */}
      <div className="flex items-center gap-3">
        <Link
          href="/parent/children"
          className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-xl tracking-tight">
            {data ? `Frais — ${data.child_name}` : "Frais scolaires"}
          </h1>
          {data && (
            <p className="text-sm text-muted-foreground">
              {data.class_name} • {data.academic_year}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <FeesSkeleton />
      ) : isError ? (
        <DataError message="Impossible de charger les frais." onRetry={() => refetch()} />
      ) : !data ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Aucune information de frais disponible.
        </div>
      ) : (
        <>
          {/* Résumé financier */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard label="Total" value={`${data.total_expected.toLocaleString("fr-FR")} FC`} />
            <SummaryCard
              label="Payé"
              value={`${data.total_paid.toLocaleString("fr-FR")} FC`}
              className="text-emerald-600 dark:text-emerald-400"
            />
            <SummaryCard
              label="Restant"
              value={`${data.total_remaining.toLocaleString("fr-FR")} FC`}
              className={data.total_remaining === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-accent"}
            />
          </div>

          {/* Barre de progression */}
          <Card className="border-0 shadow-sm ring-1 ring-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Progression des paiements</span>
                <span className="text-xs font-medium">
                  {data.total_expected > 0
                    ? `${Math.min(100, (data.total_paid / data.total_expected) * 100).toFixed(0)}%`
                    : "0%"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${data.total_expected > 0 ? Math.min(100, (data.total_paid / data.total_expected) * 100) : 0}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

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
                          {fee.total_amount.toLocaleString("fr-FR")} FC
                        </TableCell>
                        <TableCell className="text-right text-sm text-emerald-600 dark:text-emerald-400">
                          {fee.paid_amount.toLocaleString("fr-FR")} FC
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

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-3 text-center">
        <p className={`text-sm font-bold ${className ?? ""}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
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
