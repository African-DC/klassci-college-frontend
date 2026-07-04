"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, Loader2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateFeeVariant } from "@/lib/hooks/useFees"
import type { FeeCategory, FeeVariant } from "@/lib/contracts/fee"

interface FeeVariantCopyModalProps {
  open: boolean
  onClose: () => void
  mandatoryCategories: FeeCategory[]
  variants: FeeVariant[]
  levelNameMap: Map<number, string>
  academicYearId: number
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

  // Niveaux déjà configurés sur la cible : on évite de proposer un doublon.
  const targetLevelIds = useMemo(
    () => new Set(targetId ? variants.filter((v) => v.fee_category_id === targetId).map((v) => v.level_id) : []),
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
  const willSkip = chosen.filter((v) => targetLevelIds.has(v.level_id)).length
  const willCopy = chosen.length - willSkip
  const canSubmit = !!sourceId && !!targetId && sourceId !== targetId && willCopy > 0 && !busy

  async function handleCopy() {
    if (!targetId) return
    setBusy(true)
    let ok = 0
    let failed = 0
    for (const v of chosen) {
      if (targetLevelIds.has(v.level_id)) continue // doublon niveau -> on saute
      try {
        await mutateAsync({
          fee_category_id: targetId,
          level_id: v.level_id,
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
          {sourceId && (
            sourceVariants.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Niveaux à copier</p>
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border p-2">
                  {sourceVariants.map((v) => (
                    <label
                      key={v.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/50"
                    >
                      <Checkbox checked={selected.has(v.id)} onCheckedChange={() => toggle(v.id)} />
                      <span className="flex-1 text-sm">{levelNameMap.get(v.level_id) ?? `#${v.level_id}`}</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {v.amount.toLocaleString("fr-FR")} FCFA
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
                Cette catégorie n&apos;a encore aucun montant à copier.
              </p>
            )
          )}

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
