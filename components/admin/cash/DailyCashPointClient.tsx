"use client"

import { useState } from "react"
import { Banknote, ClipboardCheck, FileText, Lock, Scale, Wallet } from "lucide-react"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useDailyCashPoint } from "@/lib/hooks/useCashSessions"
import { hasBeenCounted, isLocked } from "@/lib/contracts/cash-session"
import { cashSessionsApi } from "@/lib/api/cash-sessions"
import { openPdfPreview } from "@/lib/pdf/preview"
import { CashStatusBadge, MethodBreakdown, VarianceBadge, formatFcfa } from "./cash-ui"

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
  const [printing, setPrinting] = useState(false)
  const { data, isLoading, isError, error, refetch } = useDailyCashPoint(businessDate)

  // Le point journalier se termine par une pièce qu'on archive. Le bordereau
  // consolidé existait déjà côté serveur, mais aucun écran ne l'offrait : il
  // n'était atteignable que depuis l'aperçu des paramètres PDF.
  async function handlePrint() {
    setPrinting(true)
    try {
      await openPdfPreview(() => cashSessionsApi.dailyCashBook(businessDate))
    } finally {
      setPrinting(false)
    }
  }

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
        actions={
          <button
            type="button"
            onClick={handlePrint}
            disabled={printing || isLoading}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground ring-1 ring-white/40 transition-colors hover:bg-accent/90 disabled:opacity-60"
          >
            <FileText aria-hidden="true" className="h-4 w-4" />
            {printing ? "Génération…" : "Bordereau du jour"}
          </button>
        }
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

                {/* Ventilation par moyen : le comptable rapproche un dépôt
                    bancaire d'une caisse précise, et « 20 000 F en espèces »
                    ne suffit pas à savoir ce qui est arrivé par Wave ou par
                    virement. La donnée était déjà chargée, jamais affichée. */}
                {session.by_method.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <MethodBreakdown methods={session.by_method} />
                  </div>
                )}

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
