"use client"

import { useEffect, useState } from "react"
import { Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { canUseLiveCamera } from "@/lib/photo/camera"
import { handoffRank, hasCoarsePointer, type HandoffRank } from "@/lib/photo/handoff-rank"
import { UploadHandoffDialog } from "./UploadHandoffDialog"
import type { HandoffOutcome } from "@/lib/hooks/useUploadHandoff"
import type { HandoffTargetKind } from "@/lib/contracts/upload-handoff"

/**
 * « Utiliser mon téléphone » — le même bouton pour les six points de dépôt.
 *
 * Il porte une seule décision, et c'est celle du rang : sur un appareil qu'on
 * tient dans la main et qui a une caméra, ce bouton n'apparaît pas du tout, car
 * le téléphone qu'il appellerait est celui qui l'affiche. La règle vit dans
 * `lib/photo/handoff-rank.ts`, pure et testée, plutôt que dans un ternaire
 * enfoui : elle se décide une fois pour tout le produit.
 *
 * Le rang ne se calcule qu'après le montage : `canUseLiveCamera()` répond faux
 * sur le serveur et vrai dans le navigateur, et rendre un écran pour en
 * trouver un autre à l'hydratation est une erreur qui se voit.
 */

export function useHandoffRank(): HandoffRank | null {
  const [rang, setRang] = useState<HandoffRank | null>(null)
  useEffect(() => {
    setRang(
      handoffRank({
        camera: canUseLiveCamera(),
        coarsePointer: hasCoarsePointer(),
      }),
    )
  }, [])
  return rang
}

export interface UploadHandoffButtonProps {
  targetKind: HandoffTargetKind
  subjectId?: number | null
  extras?: Record<string, string>
  onResolved: (outcome: HandoffOutcome) => void
  disabled?: boolean
  /** Par défaut « Utiliser mon téléphone ». */
  label?: string
  className?: string
}

export function UploadHandoffButton({
  targetKind,
  subjectId = null,
  extras,
  onResolved,
  disabled = false,
  label = "Utiliser mon téléphone",
  className,
}: UploadHandoffButtonProps) {
  const rang = useHandoffRank()
  const [ouvert, setOuvert] = useState(false)

  // `null` tant que le montage n'a pas eu lieu, `hidden` sur un téléphone : dans
  // les deux cas il n'y a rien à afficher, et surtout aucune session à ouvrir.
  if (rang === null || rang === "hidden") return null

  return (
    <>
      <Button
        type="button"
        variant={rang === "prominent" ? "default" : "outline"}
        className={cn("h-11", className)}
        disabled={disabled}
        onClick={() => setOuvert(true)}
      >
        <Smartphone aria-hidden />
        {label}
      </Button>

      <UploadHandoffDialog
        open={ouvert}
        onOpenChange={setOuvert}
        targetKind={targetKind}
        subjectId={subjectId}
        extras={extras}
        onResolved={onResolved}
      />
    </>
  )
}
