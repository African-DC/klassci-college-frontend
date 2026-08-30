"use client"

import { useState } from "react"
import { Banknote, CheckCircle2, FileText, Lock, Receipt, Wallet } from "lucide-react"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMyCashSession } from "@/lib/hooks/useCashSessions"
import { cashSessionsApi } from "@/lib/api/cash-sessions"
import { openPdfPreview } from "@/lib/pdf/preview"
import { hasBeenCounted, isAutoClosed, isLocked } from "@/lib/contracts/cash-session"
import {
  CashStatusBadge,
  MethodBreakdown,
  VarianceBadge,
  formatBusinessDate,
  formatFcfa,
} from "./cash-ui"
import { CloseCashDialog } from "./CloseCashDialog"
import { RegularizeCashBanner } from "./RegularizeCashBanner"

/**
 * « Ma caisse » — la journée du caissier connecté.
 *
 * Un seul écran, une seule action : voir ce qu'on a encaissé, puis clôturer.
 * Le caissier ne voit ici que ses propres versements, le backend filtrant sur
 * l'absence de `payments:read:all`.
 */
export function MyCashSessionClient() {
  const [closeOpen, setCloseOpen] = useState(false)
  const [printing, setPrinting] = useState(false)
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
    // Le bandeau reste rendu : les journées à régulariser sont indépendantes
    // de la journée en cours, et c'est justement l'action que le caissier
    // doit pouvoir mener même si sa caisse du jour ne charge pas.
    return (
      <div className="space-y-6">
        <RegularizeCashBanner />
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
      </div>
    )
  }

  // Une journée clôturée d'office est verrouillée comme une journée signée :
  // ne plus proposer de la clôturer. Elle se régularise, et cela se fait
  // depuis le bandeau, qui porte la journée concernée.
  const locked = isLocked(session)
  const counted = hasBeenCounted(session)
  const autoClosed = isAutoClosed(session)
  const businessDate = session.business_date

  async function handlePrint() {
    setPrinting(true)
    try {
      await openPdfPreview(() => cashSessionsApi.myDailyCashBook(businessDate))
    } finally {
      setPrinting(false)
    }
  }

  const kpis: HeroKpi[] = [
    { label: "Encaissé aujourd'hui", value: formatFcfa(session.total_collected), icon: Wallet },
    { label: "Dont espèces", value: formatFcfa(session.cash_collected), icon: Banknote },
    { label: "Versements", value: session.payments_count, icon: Receipt },
    {
      label: "État",
      value: autoClosed ? "Clôturée d'office" : locked ? "Clôturée" : "Ouverte",
      icon: locked ? Lock : CheckCircle2,
    },
  ]

  return (
    <div className="space-y-6">
      <RegularizeCashBanner />

      <PageHero
        icon={Wallet}
        title="Ma caisse"
        subtitle={`${session.cashier_name} · journée du ${formatBusinessDate(session.business_date)}`}
        kpis={kpis}
        actions={
          <>
            <button
              type="button"
              onClick={handlePrint}
              disabled={printing}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground ring-1 ring-white/40 transition-colors hover:bg-accent/90 disabled:opacity-60"
            >
              <FileText aria-hidden="true" className="h-4 w-4" />
              {printing ? "Génération…" : "Bordereau du jour"}
            </button>
            {!locked ? (
              <button
                type="button"
                onClick={() => setCloseOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground ring-1 ring-white/40 transition-colors hover:bg-accent/90"
              >
                <Lock aria-hidden="true" className="h-4 w-4" />
                Clôturer ma journée
              </button>
            ) : null}
          </>
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

            {autoClosed ? (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Cette journée a été clôturée d&apos;office à minuit : elle n&apos;avait pas été
                  clôturée en fin de service. Le tiroir n&apos;ayant pas été compté,
                  l&apos;écart est inconnu.
                </p>
                <dl className="space-y-3">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Espèces attendues</dt>
                    <dd className="font-medium tabular-nums">
                      {formatFcfa(session.expected_amount ?? 0)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Espèces comptées</dt>
                    <dd className="text-muted-foreground">Non comptées</dd>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <dt className="text-muted-foreground">Écart</dt>
                    <dd>
                      <VarianceBadge variance={session.variance} />
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">
                  Régularisez-la depuis le bandeau en haut de cet écran.
                </p>
              </div>
            ) : counted ? (
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
                {session.regularized_at && (
                  <p className="text-xs text-muted-foreground">
                    Journée clôturée d&apos;office puis régularisée : le comptage a été saisi
                    après coup, sur le théorique arrêté à la clôture.
                  </p>
                )}
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
