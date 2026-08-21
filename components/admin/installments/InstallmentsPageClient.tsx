"use client"

import { CalendarClock } from "lucide-react"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { useInstallmentGrid } from "@/lib/hooks/useInstallments"
import { fixedTotal, hasPercentageLine, percentageTotal } from "@/lib/contracts/installment"
import { formatFcfa } from "@/lib/utils/money"
import { InstallmentGridEditor } from "./InstallmentGridEditor"

/**
 * Configuration des tranches d'une année scolaire.
 *
 * Une tranche découpe le TOTAL des frais obligatoires, elle n'est pas une
 * catégorie de frais : le trimestre est un moment de paiement, pas une nature.
 */
export function InstallmentsPageClient() {
  const { data: yearsData } = useAcademicYears({ size: 100 })
  const years = yearsData?.items ?? []
  const currentYear = years.find((y) => y.is_current) ?? years[0]

  const [selectedId, setSelectedId] = useState<number | undefined>(undefined)
  const yearId = selectedId ?? currentYear?.id
  const { data: grid } = useInstallmentGrid(yearId)

  const lignes = grid ?? []
  const total = percentageTotal(lignes)
  const francs = fixedTotal(lignes)
  const avecPourcentage = hasPercentageLine(lignes)

  // Une grille faite uniquement de montants fixes n'a pas de « couverture » en
  // pourcentage : annoncer 0 % la ferait passer pour incomplète alors qu'elle
  // est valide. On montre alors la somme en francs, qui est l'information.
  const kpis: HeroKpi[] = [
    { label: "Tranches", value: lignes.length, icon: CalendarClock },
    avecPourcentage
      ? {
          label: "Pourcentages",
          value: `${total} %`,
          hint: total === 100 ? "Grille complète" : "À compléter",
        }
      : {
          label: "Montants fixes",
          value: formatFcfa(francs),
          hint: lignes.length > 0 ? "Grille en francs" : "Aucune tranche",
        },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        icon={CalendarClock}
        title="Tranches de paiement"
        subtitle="Découpage du total des frais obligatoires dans le temps"
        kpis={kpis}
      />

      <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-5">
          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="installment-year">Année scolaire</Label>
            <Select
              value={yearId ? String(yearId) : undefined}
              onValueChange={(v) => setSelectedId(Number(v))}
            >
              <SelectTrigger id="installment-year" className="h-11">
                <SelectValue placeholder="Choisir une année" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.id} value={String(y.id)}>
                    {y.name}
                    {y.is_current ? " (courante)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <InstallmentGridEditor academicYearId={yearId} />
    </div>
  )
}
