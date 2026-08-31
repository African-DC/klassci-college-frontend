"use client"

import { CheckCircle2, CircleDot, Circle, MinusCircle, ListChecks, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SectionTitle } from "@/components/shared/PageHero"
import { EntitlementsPopover } from "@/components/shared/fees/FeeEntitlements"
import { cn } from "@/lib/utils"
import type { FeeEntitlement } from "@/lib/contracts/fee"
import { FEE_STATUS_LABEL, isCashDue } from "@/lib/contracts/payment"

export interface EnrollmentFeeItem {
  id: number
  category_name: string
  /** Ce que ce frais ouvre à la famille, tel que le backend le renvoie. */
  entitlements?: FeeEntitlement[]
  amount: number
  paid: number
  remaining: number
  status: string
  accepts_in_kind?: boolean
  is_optional?: boolean
  option_name?: string | null
}

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`

const STATUS: Record<
  string,
  { label: string; icon: typeof CheckCircle2; dot: string; text: string }
> = {
  paid: { label: FEE_STATUS_LABEL.paid, icon: CheckCircle2, dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  partial: { label: FEE_STATUS_LABEL.partial, icon: CircleDot, dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  pending: { label: FEE_STATUS_LABEL.pending, icon: Circle, dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
  waived: { label: FEE_STATUS_LABEL.waived, icon: MinusCircle, dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
  in_kind: { label: FEE_STATUS_LABEL.in_kind, icon: Package, dot: "bg-sky-500", text: "text-sky-600 dark:text-sky-400" },
}

/**
 * Détail des frais d'une inscription : une ligne par frais avec sa progression
 * (payé / dû), le reste et le statut. Reprend la logique de lecture de
 * l'allocation d'un versement, appliquée à l'état courant des frais.
 */
export function EnrollmentFeesBreakdown({
  fees,
  onMarkDeposited,
  markingFeeId,
}: {
  fees: EnrollmentFeeItem[]
  /** Reçoit le frais entier : la confirmation doit pouvoir nommer l'article. */
  onMarkDeposited?: (fee: EnrollmentFeeItem) => void
  markingFeeId?: number | null
}) {
  if (fees.length === 0) {
    return (
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
          <ListChecks className="mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm">Aucun frais associé à cette inscription.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <SectionTitle icon={ListChecks}>Détail des frais</SectionTitle>
        <div className="divide-y divide-border/60">
          {fees.map((fee) => {
            const st = STATUS[fee.status] ?? STATUS.pending
            const StIcon = st.icon
            const pct = !isCashDue(fee.status)
              ? 100
              : fee.amount > 0
                ? Math.min(100, Math.round((fee.paid / fee.amount) * 100))
                : 0
            const name = fee.option_name ?? fee.category_name
            return (
              <div key={fee.id} className="py-3 first:pt-1 last:pb-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <StIcon className={cn("h-4 w-4 shrink-0", st.text)} />
                    <span className="truncate text-sm font-medium">{name}</span>
                    {fee.is_optional && (
                      <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Optionnel
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <EntitlementsPopover
                      categoryName={name}
                      entitlements={fee.entitlements}
                    />
                    <span className={cn("text-[11px] font-semibold uppercase tracking-wide", st.text)}>
                      {st.label}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full transition-all", st.dot)} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {fee.status === "in_kind" ? (
                      <span className="font-medium text-sky-700 dark:text-sky-400">Hors reste à payer</span>
                    ) : (
                      <>
                        <span className="font-semibold text-foreground">{fmt(fee.paid)}</span> / {fmt(fee.amount)}
                      </>
                    )}
                  </span>
                </div>
                {fee.remaining > 0 && isCashDue(fee.status) && (
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">
                    Reste : <span className="font-medium text-foreground">{fmt(fee.remaining)}</span>
                  </p>
                )}
                {onMarkDeposited &&
                  fee.status === "pending" &&
                  fee.accepts_in_kind &&
                  fee.paid === 0 && (
                    <div className="mt-2 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-11 text-xs sm:h-9"
                        disabled={markingFeeId === fee.id}
                        onClick={() => onMarkDeposited(fee)}
                      >
                        {markingFeeId === fee.id ? "Enregistrement…" : "Marquer déposé"}
                      </Button>
                    </div>
                  )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
