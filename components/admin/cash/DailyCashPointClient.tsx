"use client"

import { useState } from "react"
import { Banknote, ClipboardCheck, Lock, Scale, Wallet } from "lucide-react"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useDailyCashPoint } from "@/lib/hooks/useCashSessions"
import { hasBeenCounted, isLocked } from "@/lib/contracts/cash-session"
import { CashStatusBadge, VarianceBadge, formatFcfa } from "./cash-ui"

function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

/**
 * Point journalier du comptable : chaque caisse de la journée, son total,
 * son écart, et si elle est déjà clôturée. Une caisse encore ouverte en fin
 * de journée est l'information la plus utile de l'écran, d'où le compteur
 * dédié dans le bandeau.
 */
export function DailyCashPointClient() {
  const [businessDate, setBusinessDate] = useState(todayIso())
  const { data, isLoading, isError, error, refetch } = useDailyCashPoint(businessDate)

  const kpis: HeroKpi[] = [
    { label: "Total encaissé", value: formatFcfa(data?.total_collected ?? 0), icon: Wallet },
    { label: "Dont espèces", value: formatFcfa(data?.cash_collected ?? 0), icon: Banknote },
    { label: "Caisses ouvertes", value: data?.open_count ?? 0, icon: ClipboardCheck },
    {
      // L'écart cumulé ne couvre QUE les caisses réellement comptées. Le
      // compteur des clôtures d'office est ce qui empêche de le lire comme
      // un solde complet.
      label: "Écart cumulé",
      value: formatFcfa(data?.total_variance ?? 0),
      icon: Scale,
      hint:
        (data?.auto_closed_count ?? 0) > 0
          ? `${data?.auto_closed_count} caisse${(data?.auto_closed_count ?? 0) > 1 ? "s" : ""} clôturée${(data?.auto_closed_count ?? 0) > 1 ? "s" : ""} d'office, écart inconnu`
          : undefined,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        icon={ClipboardCheck}
        title="Point journalier"
        subtitle="Toutes les caisses de la journée, clôturées ou non"
        kpis={kpis}
      />

      <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
            <div className="space-y-2">
              <Label htmlFor="cash-point-date">Journée</Label>
              <Input
                id="cash-point-date"
                type="date"
                className="h-11 w-full sm:w-56"
                value={businessDate}
                onChange={(e) => setBusinessDate(e.target.value || todayIso())}
              />
            </div>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setBusinessDate(todayIso())}
              disabled={businessDate === todayIso()}
            >
              Aujourd&apos;hui
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : isError ? (
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="space-y-3 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Impossible de charger le point journalier."}
            </p>
            <Button variant="outline" className="h-11" onClick={() => refetch()}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : !data || data.items.length === 0 ? (
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Aucun encaissement enregistré sur cette journée.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.items.map((session) => (
            <Card key={`${session.cashier_user_id}-${session.business_date}`} className="rounded-xl border shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{session.cashier_name}</p>
                      <CashStatusBadge status={session.status} />
                      {hasBeenCounted(session) && <VarianceBadge variance={session.variance} />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {session.payments_count} versement{session.payments_count > 1 ? "s" : ""} ·{" "}
                      {formatFcfa(session.cash_collected)} en espèces
                    </p>
                    {session.notes && (
                      <p className="mt-0.5 text-xs text-muted-foreground">Note : {session.notes}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Total encaissé
                    </p>
                    <p className="text-lg font-bold tabular-nums">
                      {formatFcfa(session.total_collected)}
                    </p>
                  </div>
                </div>

                {!hasBeenCounted(session) && (
                  <p className="mt-3 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                    {isLocked(session)
                      ? "Clôturée d'office à minuit : le tiroir n'a pas été compté, l'écart reste inconnu tant que le caissier n'a pas régularisé."
                      : "Journée non clôturée : le montant compté et l'écart ne sont pas encore connus."}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
