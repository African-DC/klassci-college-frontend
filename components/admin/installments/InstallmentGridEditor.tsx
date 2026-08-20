"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CalendarClock, Plus, Save, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  isGridComplete,
  percentageTotal,
  type FeeInstallment,
  type InstallmentDraft,
} from "@/lib/contracts/installment"
import { useInstallmentGrid, useReplaceInstallmentGrid } from "@/lib/hooks/useInstallments"

function toDraft(row: FeeInstallment): InstallmentDraft {
  return {
    name: row.name,
    position: row.position,
    percentage: row.percentage,
    due_date: row.due_date,
  }
}

/** Grille proposée à une école qui n'a rien configuré : trois tranches usuelles. */
function defaultDrafts(): InstallmentDraft[] {
  return [
    { name: "Tranche 1", position: 1, percentage: 40, due_date: "" },
    { name: "Tranche 2", position: 2, percentage: 30, due_date: "" },
    { name: "Tranche 3", position: 3, percentage: 30, due_date: "" },
  ]
}

/**
 * Éditeur de la grille de tranches d'une année scolaire.
 *
 * La grille se saisit d'un bloc et se remplace d'un bloc : la somme doit faire
 * 100 %, donc une grille n'est valide que prise entièrement. Éditer une
 * tranche isolément la laisserait forcément invalide entre deux appels.
 */
export function InstallmentGridEditor({ academicYearId }: { academicYearId: number | undefined }) {
  const { data, isLoading } = useInstallmentGrid(academicYearId)
  const { mutate, isPending } = useReplaceInstallmentGrid(academicYearId)
  const [drafts, setDrafts] = useState<InstallmentDraft[]>([])

  useEffect(() => {
    if (!data) return
    setDrafts(data.length > 0 ? data.map(toDraft) : defaultDrafts())
  }, [data])

  const total = percentageTotal(drafts)
  const complete = isGridComplete(drafts)
  const allDated = drafts.every((d) => d.due_date !== "")
  const allNamed = drafts.every((d) => d.name.trim() !== "")
  const canSave = complete && allDated && allNamed && !isPending

  function update(index: number, patch: Partial<InstallmentDraft>) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  function addLine() {
    setDrafts((prev) => [
      ...prev,
      { name: `Tranche ${prev.length + 1}`, position: prev.length + 1, percentage: 0, due_date: "" },
    ])
  }

  function removeLine(index: number) {
    // Les rangs doivent rester consécutifs : ils portent l'ordre des échéances.
    setDrafts((prev) =>
      prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, position: i + 1 })),
    )
  }

  if (isLoading) {
    return <Skeleton className="h-64 rounded-xl" />
  }

  if (!academicYearId) {
    return (
      <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Sélectionnez une année scolaire pour configurer ses tranches.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2.5 border-b pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#f5821f] to-[#f9a826] text-white shadow-sm">
            <CalendarClock aria-hidden="true" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Tranches de paiement</h2>
            <p className="text-xs text-muted-foreground">
              Chaque tranche est une part du total des frais obligatoires. Le montant attendu
              s&apos;adapte donc au niveau de chaque élève, sans ressaisie.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {drafts.map((draft, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 sm:grid-cols-[1fr_7rem_11rem_auto] sm:items-end"
            >
              <div className="space-y-1.5">
                <Label htmlFor={`name-${index}`} className="text-xs">
                  Nom
                </Label>
                <Input
                  id={`name-${index}`}
                  className="h-11"
                  value={draft.name}
                  onChange={(e) => update(index, { name: e.target.value })}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pct-${index}`} className="text-xs">
                  Part (%)
                </Label>
                <Input
                  id={`pct-${index}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="0.01"
                  className="h-11 tabular-nums"
                  value={draft.percentage}
                  onChange={(e) => update(index, { percentage: Number(e.target.value) })}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`due-${index}`} className="text-xs">
                  À payer avant le
                </Label>
                <Input
                  id={`due-${index}`}
                  type="date"
                  className="h-11"
                  value={draft.due_date}
                  onChange={(e) => update(index, { due_date: e.target.value })}
                  disabled={isPending}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-destructive hover:bg-destructive/10"
                onClick={() => removeLine(index)}
                disabled={isPending || drafts.length <= 1}
                aria-label={`Supprimer ${draft.name}`}
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2"
            onClick={addLine}
            disabled={isPending || drafts.length >= 24}
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Ajouter une tranche
          </Button>

          <div className="text-sm">
            <span className="text-muted-foreground">Total : </span>
            <span className={complete ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>
              {total} %
            </span>
          </div>
        </div>

        {!complete && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
          >
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm">
              Les tranches totalisent {total} % au lieu de 100 %.{" "}
              {total < 100
                ? "Une part des frais resterait sans échéance."
                : "La grille réclamerait plus que le montant dû."}
            </p>
          </div>
        )}

        {complete && (!allDated || !allNamed) && (
          <p className="text-sm text-muted-foreground">
            {!allDated
              ? "Chaque tranche a besoin d'une date limite."
              : "Chaque tranche a besoin d'un nom."}
          </p>
        )}

        <Button
          type="button"
          className="h-11 w-full gap-2"
          onClick={() => mutate(drafts)}
          disabled={!canSave}
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {isPending ? "Enregistrement..." : "Enregistrer la grille"}
        </Button>
      </CardContent>
    </Card>
  )
}
