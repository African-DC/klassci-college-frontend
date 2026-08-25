"use client"

import { useMemo, useState } from "react"
import { Calculator } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { simulateGrid, type InstallmentDraft } from "@/lib/contracts/installment"
import { useFeeCategories, useFeeVariants } from "@/lib/hooks/useFees"
import { useLevels } from "@/lib/hooks/useLevels"
import { formatFcfa } from "@/lib/utils/money"

type Scope = "non_affecte" | "affecte"

const SCOPE_LABELS: Record<Scope, string> = {
  non_affecte: "Non affecté",
  affecte: "Affecté",
}

interface PreviewVariant {
  fee_category_id: number
  level_id: number
  series_id?: number | null
  amount: number
  assignment_scope?: string | null
}

/**
 * Le tarif retenu pour une catégorie, du plus précis au plus général.
 *
 * Un tarif réservé aux affectés ou aux non affectés l'emporte sur un tarif
 * valable pour tout le monde, exactement comme à l'inscription : sinon la
 * simulation annoncerait le plein tarif à un élève subventionné. À portée
 * égale, le tarif sans série passe devant, puisque c'est celui du tronc
 * commun — un niveau de lycée qui n'aurait que des tarifs par série en
 * montre alors un, plutôt que rien.
 */
function specificity(variant: PreviewVariant): number {
  return (variant.assignment_scope ? 2 : 0) + (variant.series_id == null ? 1 : 0)
}

/** Assiette d'un élève d'un niveau donné : la somme de ses frais obligatoires. */
function mandatoryTotalForLevel(
  variants: PreviewVariant[],
  mandatoryCategoryIds: Set<number>,
  levelId: number,
  scope: Scope,
): number {
  const retenu = new Map<number, PreviewVariant>()

  for (const variant of variants) {
    if (variant.level_id !== levelId) continue
    if (!mandatoryCategoryIds.has(variant.fee_category_id)) continue
    if (variant.assignment_scope && variant.assignment_scope !== scope) continue

    const actuel = retenu.get(variant.fee_category_id)
    if (!actuel || specificity(variant) > specificity(actuel)) {
      retenu.set(variant.fee_category_id, variant)
    }
  }

  return [...retenu.values()].reduce((total, variant) => total + variant.amount, 0)
}

/**
 * Simulation de la grille sur un niveau représentatif.
 *
 * Une directrice ne valide pas des pourcentages, elle valide des francs :
 * elle doit voir ses 37 000 puis ses 30 800 avant d'enregistrer, sur le
 * niveau et la situation d'affectation qu'elle a en tête.
 */
export function InstallmentGridPreview({
  academicYearId,
  drafts,
}: {
  academicYearId: number | undefined
  drafts: InstallmentDraft[]
}) {
  const { data: levelsData } = useLevels({ size: 100 })
  const { data: categories } = useFeeCategories()
  const { data: variants } = useFeeVariants(academicYearId)

  const levels = useMemo(
    () => [...(levelsData?.items ?? [])].sort((a, b) => a.order - b.order),
    [levelsData],
  )
  const [levelId, setLevelId] = useState<number | undefined>(undefined)
  const [scope, setScope] = useState<Scope>("non_affecte")

  const niveauChoisi = levelId ?? levels[0]?.id
  const mandatoryIds = useMemo(
    () => new Set((categories ?? []).filter((c) => c.is_mandatory).map((c) => c.id)),
    [categories],
  )

  const total = useMemo(() => {
    if (!niveauChoisi) return 0
    return mandatoryTotalForLevel(variants ?? [], mandatoryIds, niveauChoisi, scope)
  }, [variants, mandatoryIds, niveauChoisi, scope])

  const montants = useMemo(() => simulateGrid(total, drafts), [total, drafts])

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
      <div className="flex items-center gap-2.5">
        <Calculator aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Ce que donnera cette grille</h3>
          <p className="text-xs text-muted-foreground">
            Simulation sur un niveau, avant enregistrement. Chaque élève verra le calcul refait
            sur ses propres frais.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="preview-level" className="text-xs">
            Niveau
          </Label>
          <Select
            value={niveauChoisi ? String(niveauChoisi) : undefined}
            onValueChange={(v) => setLevelId(Number(v))}
          >
            <SelectTrigger id="preview-level" className="h-11">
              <SelectValue placeholder="Choisir un niveau" />
            </SelectTrigger>
            <SelectContent>
              {levels.map((level) => (
                <SelectItem key={level.id} value={String(level.id)}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preview-scope" className="text-xs">
            Situation de l&apos;élève
          </Label>
          <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <SelectTrigger id="preview-scope" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="non_affecte">{SCOPE_LABELS.non_affecte}</SelectItem>
              <SelectItem value="affecte">{SCOPE_LABELS.affecte}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun frais obligatoire n&apos;est encore défini pour ce niveau et cette situation. La
          simulation apparaîtra dès que les tarifs seront saisis.
        </p>
      ) : (
        <>
          <dl className="space-y-1.5">
            {drafts.map((draft, index) => (
              <div
                key={index}
                className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-1.5 text-sm last:border-0"
              >
                <dt className="min-w-0 truncate">
                  {draft.name.trim() || `Tranche ${index + 1}`}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {draft.kind === "fixed"
                      ? "montant fixe"
                      : `${draft.percentage ?? 0} % du reste`}
                  </span>
                </dt>
                <dd className="shrink-0 font-semibold tabular-nums">
                  {formatFcfa(montants[index] ?? 0)}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              Frais obligatoires de ce niveau ({SCOPE_LABELS[scope].toLowerCase()})
            </span>
            <span className="font-semibold tabular-nums">{formatFcfa(total)}</span>
          </div>
        </>
      )}
    </div>
  )
}
