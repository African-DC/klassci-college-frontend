"use client"

import { useState } from "react"
import { AlertTriangle, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCashSessionsToRegularize } from "@/lib/hooks/useCashSessions"
import type { CashSession } from "@/lib/contracts/cash-session"
import { RegularizeCashDialog } from "./RegularizeCashDialog"
import { formatBusinessDate, formatFcfa } from "./cash-ui"

/**
 * Ce que le caissier doit voir en arrivant le matin : les journées que le
 * système a clôturées d'office pendant la nuit, et le bouton pour les
 * régulariser.
 *
 * Un bandeau et non une pastille : la caisse est arrêtée sur un écart inconnu,
 * et tant que personne n'a saisi son comptage, la comptabilité travaille sur
 * un trou. Il faut le dire, dire pourquoi, et dire quoi faire.
 *
 * Rend `null` dans le cas normal — la plupart des caissiers clôturent leur
 * journée, et un bandeau « tout va bien » permanent finit par ne plus être lu.
 */
export function RegularizeCashBanner() {
  const [selected, setSelected] = useState<CashSession | null>(null)
  const { data, isLoading, isError } = useCashSessionsToRegularize()

  if (isLoading) {
    return <Skeleton className="h-24 rounded-xl" />
  }

  // Un échec de ce seul appel ne doit pas masquer l'écran caisse : l'erreur
  // de chargement de la journée en cours, elle, est déjà rendue en dessous.
  if (isError || !data || data.length === 0) {
    return null
  }

  const plural = data.length > 1

  return (
    <>
      <section
        role="alert"
        aria-labelledby="regularize-banner-title"
        className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500"
          />
          <div className="min-w-0 flex-1">
            <h2 id="regularize-banner-title" className="text-sm font-semibold">
              {plural
                ? `${data.length} journées de caisse clôturées d'office`
                : "Une journée de caisse clôturée d'office"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {plural ? "Ces journées n'ont pas été clôturées" : "Cette journée n'a pas été clôturée"}{" "}
              en fin de service : le système {plural ? "les" : "l'"}a arrêtée
              {plural ? "s" : ""} à minuit sans compter le tiroir. L&apos;écart reste inconnu tant
              que vous n&apos;avez pas saisi ce que vous aviez compté.
            </p>

            <ul className="mt-4 space-y-2">
              {data.map((session) => (
                <li
                  key={session.business_date}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Journée du {formatBusinessDate(session.business_date)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {session.payments_count} versement{session.payments_count > 1 ? "s" : ""} ·{" "}
                      {formatFcfa(session.expected_amount ?? 0)} attendus en espèces · écart inconnu
                    </p>
                  </div>
                  <Button
                    className="h-11 w-full shrink-0 gap-2 sm:w-auto"
                    onClick={() => setSelected(session)}
                  >
                    <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
                    Régulariser
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <RegularizeCashDialog session={selected} onClose={() => setSelected(null)} />
    </>
  )
}
