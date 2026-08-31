"use client"

import { ArrowLeft, CheckCircle, Clock, AlertCircle, Package } from "lucide-react"
import Link from "next/link"
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
import { DataError } from "@/components/shared/DataError"
import { useParentChildFees } from "@/lib/hooks/useParentPortal"
import type { ParentChildFeeItem } from "@/lib/contracts/parent-portal"

const STATUS_CONFIG: Record<ParentChildFeeItem["status"], { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof CheckCircle }> = {
  paye: { label: "Payé", variant: "default", icon: CheckCircle },
  partiel: { label: "Partiel", variant: "secondary", icon: Clock },
  impaye: { label: "Impayé", variant: "destructive", icon: AlertCircle },
  depose: { label: "Déposé en nature", variant: "secondary", icon: Package },
  exonere: { label: "Exonéré", variant: "secondary", icon: CheckCircle },
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
          aria-label="Retour à la liste des enfants"
          className="flex h-11 w-11 items-center justify-center rounded-lg border transition-colors hover:bg-muted sm:h-9 sm:w-9"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-xl tracking-tight">
            {data?.child_name ? `Frais — ${data.child_name}` : "Frais scolaires"}
          </h1>
          {data?.class_name && (
            <p className="text-sm text-muted-foreground">
              {data.class_name}
              {data.academic_year ? ` • ${data.academic_year}` : ""}
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
          {/* Synthèse aux couleurs KLASSCI */}
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
                          {fee.status === "depose"
                            ? "—"
                            : `${fee.paid_amount.toLocaleString("fr-FR")} FCFA`}
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
