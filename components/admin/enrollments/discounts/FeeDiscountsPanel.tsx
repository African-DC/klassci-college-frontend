"use client"

import { useState } from "react"
import { BadgePercent, Pencil, Plus, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionTitle } from "@/components/shared/PageHero"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useFeeDiscounts, useRemoveFeeDiscount } from "@/lib/hooks/useFeeDiscounts"
import type { FeeDiscount } from "@/lib/contracts/fee-discount"
import type { EnrollmentFeeItem } from "@/components/admin/payments/EnrollmentFeesBreakdown"
import { FeeDiscountDialog } from "./FeeDiscountDialog"

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`

/**
 * Carte financière par inscription : un montant nominal, une décision, un net.
 * La permission de lecture protège aussi la requête (pas seulement les boutons).
 */
export function FeeDiscountsPanel({
  enrollmentId, studentId, fees,
}: {
  enrollmentId: number
  studentId: number
  fees: EnrollmentFeeItem[]
}) {
  const { has, isLoading: loadingPermissions } = usePermissions()
  const mayRead = has("discounts:read")
  const mayManage = has("discounts:manage")
  const { data, isLoading, isError, refetch } = useFeeDiscounts(enrollmentId, mayRead)
  const remove = useRemoveFeeDiscount(enrollmentId, studentId)
  const [editing, setEditing] = useState<{ fee: EnrollmentFeeItem; discount: FeeDiscount | null } | null>(null)
  const [removing, setRemoving] = useState<{ fee: EnrollmentFeeItem; discount: FeeDiscount } | null>(null)

  if (loadingPermissions) return <Skeleton className="h-36 rounded-xl" />
  if (!mayRead) return null
  if (isLoading) return <Skeleton className="h-36 rounded-xl" />

  if (isError) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-destructive">Impossible de lire les réductions de cette inscription.</p>
          <Button variant="outline" onClick={() => void refetch()}>Réessayer</Button>
        </CardContent>
      </Card>
    )
  }

  const discounts = new Map((data ?? []).map((discount) => [discount.enrollment_fee_id, discount]))
  const eligible = fees.filter((fee) =>
    fee.status !== "in_kind" && (fee.status !== "waived" || discounts.has(fee.id)),
  )

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <SectionTitle icon={BadgePercent}>Réductions individuelles</SectionTitle>
        <p className="text-sm text-muted-foreground">
          Les réductions sont propres à cette inscription et ne modifient pas la grille de l'établissement.
          Chaque décision est conservée dans le journal d'audit.
        </p>
        {eligible.length === 0 ? (
          <p className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            Aucun frais modifiable sur cette inscription.
          </p>
        ) : (
          <div className="divide-y divide-border/60">
            {eligible.map((fee) => {
              const discount = discounts.get(fee.id) ?? null
              const nominal = discount?.original_amount ?? fee.amount
              const name = fee.option_name ?? fee.category_name
              return (
                <div key={fee.id} className="flex flex-col gap-3 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold">{name}</p>
                    {discount ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Tarif : {fmt(nominal)} · Réduction : <span className="font-semibold text-emerald-600">− {fmt(discount.discount_amount)}</span>
                        </p>
                        <p className="text-sm font-semibold text-primary">Net à régler : {fmt(fee.amount)}</p>
                        <p className="text-xs text-muted-foreground">{discount.reason}</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Tarif applicable : {fmt(nominal)} · Aucune réduction</p>
                    )}
                  </div>
                  {mayManage && (
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button type="button" variant="outline" className="h-10"
                        onClick={() => setEditing({ fee, discount })}>
                        {discount ? <Pencil className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
                        {discount ? "Modifier" : "Accorder"}
                      </Button>
                      {discount && (
                        <Button type="button" variant="ghost" className="h-10"
                          onClick={() => setRemoving({ fee, discount })}>
                          <RotateCcw className="mr-1.5 h-4 w-4" /> Annuler
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {!mayManage && (
          <p className="text-xs text-muted-foreground">
            Consultez la direction pour l'octroi ou l'annulation d'une réduction.
          </p>
        )}
      </CardContent>

      {editing && (
        <FeeDiscountDialog
          key={editing.fee.id}
          fee={editing.fee}
          current={editing.discount}
          enrollmentId={enrollmentId}
          studentId={studentId}
          open={true}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmActionDialog
        open={!!removing}
        onOpenChange={(open) => { if (!open && !remove.isPending) setRemoving(null) }}
        tone="warning"
        title="Annuler cette réduction ?"
        description={`Le tarif initial de « ${removing?.fee.option_name ?? removing?.fee.category_name ?? ""} » sera rétabli sur cette inscription. Les paiements existants restent inchangés.`}
        details={removing ? (
          <p>Montant restauré : <strong>{fmt(removing.discount.original_amount)}</strong></p>
        ) : undefined}
        confirmLabel="Rétablir le tarif initial"
        pendingLabel="Annulation..."
        pending={remove.isPending}
        onConfirm={() => {
          if (!removing) return
          remove.mutate(removing.fee.id, { onSuccess: () => setRemoving(null) })
        }}
      />
    </Card>
  )
}
