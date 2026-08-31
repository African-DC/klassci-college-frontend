"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, Loader2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FeeVariantCopyList } from "./FeeVariantCopyList"
import { FeesAcademicYearNotice } from "./FeesAcademicYearBar"
import { useCreateFeeVariant } from "@/lib/hooks/useFees"
import type { FeeCategory, FeeVariant } from "@/lib/contracts/fee"
import type { AcademicYear } from "@/lib/contracts/academic-year"

/**
 * Un niveau peut porter plusieurs montants pour la même catégorie, un par
 * public visé. La clé les distingue, sinon copier une grille « affecté + non
 * affecté » ou « nouveaux + anciens » n'en retiendrait qu'une moitié en
 * croyant à un doublon.
 *
 * Toute dimension ajoutée au tarif se pose ici aussi : la clé doit porter
 * exactement ce que la contrainte d'unicité porte côté serveur.
 */
function variantKey(v: Pick<FeeVariant, "level_id" | "assignment_scope" | "enrollment_profile">): string {
  return `${v.level_id}:${v.assignment_scope ?? "tous"}:${v.enrollment_profile ?? "tous"}`
}

interface FeeVariantCopyModalProps {
  open: boolean
  onClose: () => void
  mandatoryCategories: FeeCategory[]
  variants: FeeVariant[]
  levelNameMap: Map<number, string>
  academicYearId: number
  /** Année affichée par l'écran, rappelée ici avant de copier. */
  academicYear?: AcademicYear
}

/**
 * Copie les montants d'une catégorie source vers une catégorie cible.
 * Cas d'usage : on a saisi la grille de « Scolarité Trimestre 1 » (un montant
 * par niveau) et on veut la même pour « Trimestre 2 » sans tout ressaisir.
 * On choisit la source, on coche les niveaux à copier (tous par défaut), la
 * cible, et chaque montant est créé sur la cible.
 */
export function FeeVariantCopyModal({
  open,
  onClose,
  mandatoryCategories,
  variants,
  levelNameMap,
  academicYearId,
  academicYear,
}: FeeVariantCopyModalProps) {
  const [sourceId, setSourceId] = useState<number | null>(null)
  const [targetId, setTargetId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)

  const { mutateAsync } = useCreateFeeVariant()

  // Montants de la catégorie source (un par niveau).
  const sourceVariants = useMemo(
    () => (sourceId ? variants.filter((v) => v.fee_category_id === sourceId) : []),
    [sourceId, variants],
  )

  // À chaque changement de source, tout re-cocher par défaut.
  useEffect(() => {
    setSelected(new Set(sourceVariants.map((v) => v.id)))
  }, [sourceVariants])

  // Réinitialiser à l'ouverture.
  useEffect(() => {
    if (open) {
      setSourceId(null)
      setTargetId(null)
      setSelected(new Set())
    }
  }, [open])

  // Couples niveau + portée déjà configurés sur la cible : on évite de
  // proposer un doublon.
  const targetKeys = useMemo(
    () =>
      new Set(
        targetId
          ? variants
              .filter((v) => v.fee_category_id === targetId)
              .map((v) => variantKey(v))
          : [],
      ),
    [targetId, variants],
  )

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const chosen = sourceVariants.filter((v) => selected.has(v.id))
  const willSkip = chosen.filter((v) => targetKeys.has(variantKey(v))).length
  const willCopy = chosen.length - willSkip
  const canSubmit = !!sourceId && !!targetId && sourceId !== targetId && willCopy > 0 && !busy

  async function handleCopy() {
    if (!targetId) return
    setBusy(true)
    let ok = 0
    let failed = 0
    for (const v of chosen) {
      if (targetKeys.has(variantKey(v))) continue // doublon -> on saute
      try {
        await mutateAsync({
          fee_category_id: targetId,
          level_id: v.level_id,
          // Sans la portée, un montant réservé aux affectés serait recopié
          // comme applicable à tous : les non affectés paieraient le tarif
          // subventionné et l'école perdrait la différence.
          assignment_scope: v.assignment_scope ?? null,
          // Même raison : un droit d'inscription réservé aux nouveaux, recopié
          // sans son profil, serait refacturé à tous les anciens de l'école.
          enrollment_profile: v.enrollment_profile ?? null,
          amount: v.amount,
          academic_year_id: academicYearId,
        })
        ok++
      } catch {
        failed++
      }
    }
    setBusy(false)
    if (ok > 0) toast.success(`${ok} montant${ok > 1 ? "s" : ""} copié${ok > 1 ? "s" : ""}`)
    if (failed > 0) toast.error(`${failed} montant${failed > 1 ? "s" : ""} en erreur`)
    if (ok > 0) onClose()
  }

  const targetName = mandatoryCategories.find((c) => c.id === targetId)?.name

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-primary" />
            Copier des montants
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <FeesAcademicYearNotice year={academicYear} action="La copie reste sur" />
          {/* Source */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Copier depuis</label>
            <Select value={sourceId?.toString() ?? ""} onValueChange={(v) => setSourceId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie source" />
              </SelectTrigger>
              <SelectContent>
                {mandatoryCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Montants source à copier */}
          {sourceId ? (
            <FeeVariantCopyList
              variants={sourceVariants}
              selected={selected}
              onToggle={toggle}
              levelNameMap={levelNameMap}
            />
          ) : null}

          {/* Cible */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium">
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              Vers la catégorie
            </label>
            <Select value={targetId?.toString() ?? ""} onValueChange={(v) => setTargetId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie cible" />
              </SelectTrigger>
              <SelectContent>
                {mandatoryCategories
                  .filter((c) => c.id !== sourceId)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Récap */}
          {sourceId && targetId && (
            <p className="text-xs text-muted-foreground">
              {willCopy > 0
                ? `${willCopy} montant${willCopy > 1 ? "s seront copiés" : " sera copié"} vers « ${targetName} ».`
                : "Aucun montant à copier (niveaux déjà configurés sur la cible)."}
              {willSkip > 0 && ` ${willSkip} ignoré${willSkip > 1 ? "s" : ""} (déjà présent${willSkip > 1 ? "s" : ""}).`}
            </p>
          )}

          <Button className="w-full" disabled={!canSubmit} onClick={handleCopy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Copie...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copier {willCopy > 0 ? `${willCopy} montant${willCopy > 1 ? "s" : ""}` : ""}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
