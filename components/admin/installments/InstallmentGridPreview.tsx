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
  basketTotal,
  type FeeAudience,
} from "@/lib/contracts/fee-audience"
import type { EnrollmentProfile } from "@/lib/contracts/fee"
import { useMandatoryBasket } from "@/lib/hooks/useFees"
import { useLevels } from "@/lib/hooks/useLevels"
import { formatFcfa } from "@/lib/utils/money"

/** Valeur de liste pour « profil non tranché » : un select ne porte pas `null`. */
const PROFIL_NON_TRANCHE = "non_tranche"

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
  const { data: basket } = useMandatoryBasket(academicYearId)

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
  // Une lecture, pas un calcul : le serveur a deja arbitre quel tarif
  // l'emporte pour ce public, avec les memes fonctions qu'au guichet.
  const total = basketTotal(basket, niveauChoisi, audience) ?? 0

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
          Aucun frais obligatoire n&apos;est défini pour ce niveau et un {publicVise}. La
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
              Frais obligatoires de ce niveau, pour un {publicVise}
            </span>
            <span className="shrink-0 font-semibold tabular-nums">{formatFcfa(total)}</span>
          </div>
        </>
      )}
    </div>
  )
}
