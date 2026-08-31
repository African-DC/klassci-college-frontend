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
import {
  AUDIENCE_PROFILES,
  AUDIENCE_SCOPES,
  audienceLabel,
  mostSpecificVariantPerCategory,
  type FeeAudience,
} from "@/lib/contracts/fee-audience"
import type { EnrollmentProfile } from "@/lib/contracts/fee"
import { useFeeCategories, useFeeVariants } from "@/lib/hooks/useFees"
import { useLevels } from "@/lib/hooks/useLevels"
import { formatFcfa } from "@/lib/utils/money"

/** Valeur de liste pour « profil non tranché » : un select ne porte pas `null`. */
const PROFIL_NON_TRANCHE = "non_tranche"

interface PreviewVariant {
  fee_category_id: number
  level_id: number
  series_id?: number | null
  amount: number
  assignment_scope?: string | null
  enrollment_profile?: string | null
}

/**
 * Assiette d'un élève d'un niveau donné : la somme de ses frais obligatoires.
 *
 * L'arbitrage vient du contrat partagé, pas d'ici : un tarif réservé aux
 * nouveaux entré dans l'assiette de tout le monde ferait valider à la
 * directrice un échéancier que personne ne paiera. Un tarif au plus par
 * catégorie, le plus précis pour ce public exactement, comme le serveur en
 * décide au moment d'inscrire.
 */
function mandatoryTotalForLevel(
  variants: PreviewVariant[],
  mandatoryCategoryIds: Set<number>,
  levelId: number,
  audience: FeeAudience,
): number {
  const duNiveau = variants.filter(
    (v) => v.level_id === levelId && mandatoryCategoryIds.has(v.fee_category_id),
  )

  return mostSpecificVariantPerCategory(duNiveau, audience).reduce(
    (total, variant) => total + variant.amount,
    0,
  )
}

/**
 * Simulation de la grille sur un niveau représentatif.
 *
 * Une directrice ne valide pas des pourcentages, elle valide des francs :
 * elle doit voir ses 37 000 puis ses 30 800 avant d'enregistrer, sur le
 * niveau et le public qu'elle a en tête. L'écran nomme ce public sous le
 * total : une simulation qui ne dit pas de qui elle parle est pire qu'une
 * simulation absente, parce qu'elle finit recopiée dans un règlement.
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
  const [scope, setScope] = useState<FeeAudience["assignment_scope"]>("non_affecte")
  // « Non tranché » par défaut : tant que l'école n'a pas dit qui est nouveau
  // et qui ne l'est pas, la simulation ne le suppose pas non plus. Elle montre
  // alors le socle facturé à tout le monde, et elle le dit.
  const [profil, setProfil] = useState<EnrollmentProfile>(null)

  const niveauChoisi = levelId ?? levels[0]?.id
  const audience = useMemo<FeeAudience>(
    () => ({ assignment_scope: scope, enrollment_profile: profil }),
    [scope, profil],
  )
  const mandatoryIds = useMemo(
    () => new Set((categories ?? []).filter((c) => c.is_mandatory).map((c) => c.id)),
    [categories],
  )

  const total = useMemo(() => {
    if (!niveauChoisi) return 0
    return mandatoryTotalForLevel(variants ?? [], mandatoryIds, niveauChoisi, audience)
  }, [variants, mandatoryIds, niveauChoisi, audience])

  const montants = useMemo(() => simulateGrid(total, drafts), [total, drafts])
  const publicVise = audienceLabel(audience)
  const aideProfil = AUDIENCE_PROFILES.find((p) => p.value === profil)?.hint

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
      <div className="flex items-center gap-2.5">
        <Calculator aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Ce que donnera cette grille</h3>
          <p className="text-xs text-muted-foreground">
            Simulation sur un niveau et un public, avant enregistrement. Chaque élève verra le
            calcul refait sur ses propres frais.
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
          <Select
            value={scope}
            onValueChange={(v) => setScope(v as FeeAudience["assignment_scope"])}
          >
            <SelectTrigger id="preview-scope" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIENCE_SCOPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="preview-profile" className="text-xs">
            Profil de l&apos;élève
          </Label>
          <Select
            value={profil ?? PROFIL_NON_TRANCHE}
            onValueChange={(v) =>
              setProfil(v === PROFIL_NON_TRANCHE ? null : (v as EnrollmentProfile))
            }
          >
            <SelectTrigger id="preview-profile" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIENCE_PROFILES.map((p) => (
                <SelectItem
                  key={p.value ?? PROFIL_NON_TRANCHE}
                  value={p.value ?? PROFIL_NON_TRANCHE}
                >
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {aideProfil && <p className="text-xs text-muted-foreground">{aideProfil}</p>}
        </div>
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun frais obligatoire n&apos;est défini pour ce niveau et un élève {publicVise}. La
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
            <span className="min-w-0 text-muted-foreground">
              Frais obligatoires de ce niveau, pour un élève {publicVise}
            </span>
            <span className="shrink-0 font-semibold tabular-nums">{formatFcfa(total)}</span>
          </div>
        </>
      )}
    </div>
  )
}
