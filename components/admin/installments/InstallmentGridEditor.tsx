"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CalendarClock, Info, Plus, Save, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  fixedTotal,
  hasPercentageLine,
  isGridComplete,
  percentageTotal,
  type FeeInstallment,
  type InstallmentDraft,
  type InstallmentKind,
} from "@/lib/contracts/installment"
import { useInstallmentGrid, useReplaceInstallmentGrid } from "@/lib/hooks/useInstallments"
import { formatFcfa } from "@/lib/utils/money"
import { InstallmentGridPreview } from "./InstallmentGridPreview"

function toDraft(row: FeeInstallment): InstallmentDraft {
  return {
    name: row.name,
    position: row.position,
    kind: row.kind,
    percentage: row.percentage ?? null,
    amount: row.amount ?? null,
    due_date: row.due_date,
  }
}

/** Grille proposée à une école qui n'a rien configuré : trois tranches usuelles. */
function defaultDrafts(): InstallmentDraft[] {
  return [
    { name: "Tranche 1", position: 1, kind: "percentage", percentage: 40, amount: null, due_date: "" },
    { name: "Tranche 2", position: 2, kind: "percentage", percentage: 30, amount: null, due_date: "" },
    { name: "Tranche 3", position: 3, kind: "percentage", percentage: 30, amount: null, due_date: "" },
  ]
}

/** Ce que l'API attend : l'écriture non retenue part vide, jamais à zéro. */
function toPayload(draft: InstallmentDraft) {
  return {
    name: draft.name,
    position: draft.position,
    kind: draft.kind,
    percentage: draft.kind === "percentage" ? draft.percentage : null,
    amount: draft.kind === "fixed" ? draft.amount : null,
    due_date: draft.due_date,
  }
}

function isLineFilled(draft: InstallmentDraft): boolean {
  const valeur = draft.kind === "fixed" ? draft.amount : draft.percentage
  return draft.name.trim() !== "" && draft.due_date !== "" && (valeur ?? 0) > 0
}

/**
 * Éditeur de la grille de tranches d'une année scolaire.
 *
 * Chaque ligne s'exprime au choix en pourcentage ou en montant ferme. La
 * grille se saisit d'un bloc et se remplace d'un bloc : les pourcentages
 * doivent faire 100 % du reste, une grille n'est donc valide que prise
 * entièrement.
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
  const francs = fixedTotal(drafts)
  const avecPourcentage = hasPercentageLine(drafts)
  const complete = isGridComplete(drafts)
  const toutesRemplies = drafts.every(isLineFilled)
  const canSave = complete && toutesRemplies && !isPending

  function update(index: number, patch: Partial<InstallmentDraft>) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  function changeKind(index: number, kind: InstallmentKind) {
    // L'écriture abandonnée est vidée : garder un pourcentage résiduel sous une
    // tranche en francs laisserait deux vérités dans la même ligne.
    update(index, { kind, percentage: null, amount: null })
  }

  function addLine() {
    setDrafts((prev) => [
      ...prev,
      {
        name: `Tranche ${prev.length + 1}`,
        position: prev.length + 1,
        kind: "percentage",
        percentage: null,
        amount: null,
        due_date: "",
      },
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
              Chaque tranche s&apos;exprime au choix en montant fixe ou en pourcentage. Posez en
              francs ce que vous connaissez déjà, l&apos;inscription par exemple, et laissez les
              pourcentages suivre le niveau de chaque élève.
            </p>
          </div>
        </div>

        <div
          role="note"
          className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-3"
        >
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                Les montants fixes se prélèvent en premier ;
              </span>{" "}
              les pourcentages se partagent ensuite ce qui reste. Un pourcentage porte donc sur le
              solde après montants fixes, jamais sur le total.
            </p>
            <p>
              L&apos;assiette est le <span className="font-medium">total des frais obligatoires</span>{" "}
              de l&apos;élève. En sont exclus les frais optionnels souscrits à part, cantine,
              transport ou autres, ainsi que les frais dont l&apos;élève a été exonéré.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {drafts.map((draft, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 sm:grid-cols-[1fr_9rem_9rem_11rem_auto] sm:items-end"
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
                <Label htmlFor={`kind-${index}`} className="text-xs">
                  Exprimée en
                </Label>
                <Select
                  value={draft.kind}
                  onValueChange={(v) => changeKind(index, v as InstallmentKind)}
                  disabled={isPending}
                >
                  <SelectTrigger id={`kind-${index}`} className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.kind === "percentage" ? (
                <div className="space-y-1.5">
                  <Label htmlFor={`pct-${index}`} className="text-xs">
                    Part du reste (%)
                  </Label>
                  <Input
                    id={`pct-${index}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="0.01"
                    className="h-11 tabular-nums"
                    value={draft.percentage ?? ""}
                    onChange={(e) =>
                      update(index, {
                        percentage: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    disabled={isPending}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor={`amount-${index}`} className="text-xs">
                    Montant (FCFA)
                  </Label>
                  <Input
                    id={`amount-${index}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step="1"
                    className="h-11 tabular-nums"
                    value={draft.amount ?? ""}
                    onChange={(e) =>
                      update(index, {
                        amount: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    disabled={isPending}
                  />
                </div>
              )}
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

          <div className="space-y-0.5 text-right text-sm">
            {avecPourcentage && (
              <div>
                <span className="text-muted-foreground">Pourcentages : </span>
                <span
                  className={
                    complete ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"
                  }
                >
                  {total} %
                </span>
              </div>
            )}
            {francs > 0 && (
              <div>
                <span className="text-muted-foreground">Montants fixes : </span>
                <span className="font-semibold tabular-nums">{formatFcfa(francs)}</span>
              </div>
            )}
          </div>
        </div>

        {avecPourcentage && !complete && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
          >
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm">
              Les tranches en pourcentage totalisent {total} % au lieu de 100 %.{" "}
              {total < 100
                ? "Une part des frais resterait sans échéance."
                : "La grille réclamerait plus que le montant dû."}
            </p>
          </div>
        )}

        {!avecPourcentage && drafts.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Cette grille ne contient que des montants fixes. Aucune somme n&apos;est imposée, car
            le total des frais change d&apos;un niveau à l&apos;autre. Vérifiez la simulation
            ci-dessous : ce qu&apos;elle ne couvre pas restera sans date d&apos;échéance.
          </p>
        )}

        {complete && !toutesRemplies && (
          <p className="text-sm text-muted-foreground">
            Chaque tranche a besoin d&apos;un nom, d&apos;une valeur et d&apos;une date limite.
          </p>
        )}

        <InstallmentGridPreview academicYearId={academicYearId} drafts={drafts} />

        <Button
          type="button"
          className="h-11 w-full gap-2"
          onClick={() => mutate(drafts.map(toPayload))}
          disabled={!canSave}
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {isPending ? "Enregistrement..." : "Enregistrer la grille"}
        </Button>
      </CardContent>
    </Card>
  )
}
