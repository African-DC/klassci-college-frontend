"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, History, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import type { SchoolSettings } from "@/lib/contracts/settings"
import { useEnrollmentHistoryCoverage, useUpdateSchoolInfo } from "@/lib/hooks/useSettings"

interface EnrollmentHistorySectionProps {
  settings: SchoolSettings
}

/**
 * Le réglage qui autorise le logiciel à deviner si un élève est nouveau.
 *
 * Il existe parce qu'une base qui ne porte que l'année en cours ne distingue
 * pas un arrivant d'un ancien pas encore ressaisi : ni l'un ni l'autre n'a
 * d'inscription antérieure. Tant que l'école ne l'a pas coché, le logiciel
 * répond « je ne sais pas » et le secrétariat tranche, dossier en main.
 *
 * Ce que cet écran ajoute, et qui manquait : le chiffre. Cocher change ce que
 * des familles paieront, et rien ne le disait au moment de cocher.
 */
export function EnrollmentHistorySection({ settings }: EnrollmentHistorySectionProps) {
  const { data: couverture, isLoading } = useEnrollmentHistoryCoverage()
  const { mutate, isPending } = useUpdateSchoolInfo()
  const [coche, setCoche] = useState(settings.enrollment_history_is_reliable)

  const modifie = coche !== settings.enrollment_history_is_reliable

  function enregistrer() {
    // `school_name` accompagne toujours l'envoi : le contrat de mise à jour
    // l'exige, et l'omettre viderait le nom de l'établissement.
    mutate({ school_name: settings.school_name, enrollment_history_is_reliable: coche })
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History aria-hidden className="h-4 w-4 text-muted-foreground" />
          Historique des inscriptions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Quand les années précédentes sont complètes dans le logiciel, il peut proposer lui-même
          si un élève arrive pour la première fois. Sinon, c&apos;est à vous de le dire à chaque
          inscription.
        </p>

        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : couverture ? (
          <div
            role={couverture.is_sufficient ? undefined : "alert"}
            className={
              couverture.is_sufficient
                ? "flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5"
                : "flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-700/60 dark:bg-amber-950/30"
            }
          >
            {couverture.is_sufficient ? (
              <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400"
              />
            )}
            <p className="min-w-0 text-sm text-foreground">
              {couverture.warning ??
                `${couverture.with_anterior} de vos ${couverture.enrolled_this_year} élèves inscrits cette année ont une inscription enregistrée sur une année antérieure.`}
            </p>
          </div>
        ) : null}

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
          <Checkbox
            checked={coche}
            onCheckedChange={(v) => setCoche(v === true)}
            className="mt-0.5 h-5 w-5"
            aria-describedby="historique-consequence"
          />
          <span className="min-w-0 space-y-1">
            <span className="block text-sm font-medium">
              Les inscriptions des années précédentes sont complètes
            </span>
            <span id="historique-consequence" className="block text-xs text-muted-foreground">
              Le logiciel proposera alors, à chaque inscription, si l&apos;élève est nouveau. Il ne
              le fera que si assez d&apos;élèves de cette année sont rattachés au passé enregistré.
            </span>
          </span>
        </label>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={enregistrer}
            disabled={!modifie || isPending}
            className="h-11 sm:h-10"
          >
            {isPending ? <Loader2 aria-hidden className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
