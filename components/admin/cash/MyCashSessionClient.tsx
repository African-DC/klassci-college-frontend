"use client"

import { useState } from "react"
import { Banknote, CheckCircle2, Lock, Receipt, Wallet } from "lucide-react"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMyCashSession } from "@/lib/hooks/useCashSessions"
import { isClosed } from "@/lib/contracts/cash-session"
import { CashStatusBadge, MethodBreakdown, VarianceBadge, formatFcfa } from "./cash-ui"
import { CloseCashDialog } from "./CloseCashDialog"

/**
 * « Ma caisse » — la journée du caissier connecté.
 *
 * Un seul écran, une seule action : voir ce qu'on a encaissé, puis clôturer.
 * Le caissier ne voit ici que ses propres versements, le backend filtrant sur
 * l'absence de `payments:read:all`.
 */
export function MyCashSessionClient() {
  const [closeOpen, setCloseOpen] = useState(false)
  const { data: session, isLoading, isError, error, refetch } = useMyCashSession()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (isError || !session) {
    return (
      <Card className="rounded-xl border shadow-sm">
        <CardContent className="space-y-3 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Impossible de charger votre caisse."}
          </p>
          <Button variant="outline" className="h-11" onClick={() => refetch()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  const closed = isClosed(session)

  const kpis: HeroKpi[] = [
    { label: "Encaissé aujourd'hui", value: formatFcfa(session.total_collected), icon: Wallet },
    { label: "Dont espèces", value: formatFcfa(session.cash_collected), icon: Banknote },
    { label: "Versements", value: session.payments_count, icon: Receipt },
    {
      label: "État",
      value: closed ? "Clôturée" : "Ouverte",
      icon: closed ? Lock : CheckCircle2,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        icon={Wallet}
        title="Ma caisse"
        subtitle={`${session.cashier_name} · journée du ${session.business_date}`}
        kpis={kpis}
        actions={
          !closed ? (
            <button
              type="button"
              onClick={() => setCloseOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground ring-1 ring-white/40 transition-colors hover:bg-accent/90"
            >
              <Lock aria-hidden="true" className="h-4 w-4" />
              Clôturer ma journée
            </button>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-semibold">Détail par moyen de paiement</h2>
              <CashStatusBadge status={session.status} />
            </div>
            <MethodBreakdown methods={session.by_method} />
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardContent className="space-y-4 p-5">
            <h2 className="border-b pb-3 text-sm font-semibold">Clôture</h2>

            {closed ? (
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Espèces attendues</dt>
                  <dd className="font-medium tabular-nums">
                    {formatFcfa(session.expected_amount ?? 0)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Espèces comptées</dt>
                  <dd className="font-medium tabular-nums">
                    {formatFcfa(session.counted_amount ?? 0)}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <dt className="text-muted-foreground">Écart</dt>
                  <dd>
                    <VarianceBadge variance={session.variance} />
                  </dd>
                </div>
                {session.notes && (
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Note</dt>
                    <dd className="mt-1 text-sm">{session.notes}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  En fin de journée, comptez votre tiroir et saisissez le montant. Le système
                  affiche l&apos;écart avec le théorique, puis verrouille la journée.
                </p>
                <Button className="h-11 w-full gap-2" onClick={() => setCloseOpen(true)}>
                  <Lock aria-hidden="true" className="h-4 w-4" />
                  Clôturer ma journée
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CloseCashDialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        expectedCash={session.cash_collected}
      />
    </div>
  )
}
