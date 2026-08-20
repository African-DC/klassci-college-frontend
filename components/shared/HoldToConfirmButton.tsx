"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HoldToConfirmButtonProps {
  /** Durée du maintien, en secondes. 5 pour archiver, 10 pour supprimer. */
  seconds: number
  /** Ce que fait le bouton au repos. */
  label: string
  /** Ce qu'affiche le bouton pendant le maintien. */
  holdingLabel: string
  onConfirm: () => void
  variant?: ButtonProps["variant"]
  disabled?: boolean
  className?: string
}

/**
 * Bouton qu'il faut maintenir enfoncé pour confirmer.
 *
 * Pourquoi pas un simple clic : ces gestes ne se rattrapent pas. Une seconde
 * d'attention involontaire suffit à cliquer, pas à tenir cinq secondes le
 * doigt sur un bouton qui décompte. Le geste devient une décision.
 *
 * Relâcher avant la fin annule sans rien envoyer, et l'anneau repart de zéro :
 * on ne cumule pas les maintiens successifs, sinon trois hésitations vaudraient
 * une confirmation.
 */
export function HoldToConfirmButton({
  seconds,
  label,
  holdingLabel,
  onConfirm,
  variant = "destructive",
  disabled = false,
  className,
}: HoldToConfirmButtonProps) {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)

  const frameRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)
  // Miroir en ref de `holding` : la boucle d'animation lit une valeur fraîche
  // à chaque image, là où l'état React de la fermeture serait figé.
  const holdingRef = useRef(false)
  // On appelle toujours le dernier `onConfirm` reçu sans relancer la boucle.
  const onConfirmRef = useRef(onConfirm)

  useEffect(() => {
    onConfirmRef.current = onConfirm
  }, [onConfirm])

  const cancel = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    holdingRef.current = false
    setHolding(false)
    setProgress(0)
  }, [])

  const start = useCallback(() => {
    if (disabled || holdingRef.current) return
    holdingRef.current = true
    setHolding(true)
    setProgress(0)
    startedAtRef.current = performance.now()

    const tick = (now: number) => {
      // Le composant a pu être démonté ou le maintien annulé entre deux
      // images : sans cette garde, une image en vol déclencherait une
      // suppression définitive sur un écran qui n'existe plus.
      if (!holdingRef.current) return
      const ratio = Math.min(1, (now - startedAtRef.current) / (seconds * 1000))
      setProgress(ratio)
      if (ratio >= 1) {
        holdingRef.current = false
        frameRef.current = null
        setHolding(false)
        setProgress(0)
        onConfirmRef.current()
        return
      }
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
  }, [disabled, seconds])

  // Démontage : on coupe la boucle et on neutralise la garde, pour qu'aucune
  // image déjà programmée ne confirme quoi que ce soit après coup.
  useEffect(() => {
    return () => {
      holdingRef.current = false
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [])

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      // On n'intercepte Échap que si un maintien est en cours : sinon la
      // touche doit continuer à fermer le dialogue qui contient le bouton.
      if (holdingRef.current) {
        event.stopPropagation()
        cancel()
      }
      return
    }
    if (event.key !== " " && event.key !== "Enter") return
    // Sans cela, le navigateur émettrait un clic natif au relâchement :
    // le maintien deviendrait un simple appui.
    event.preventDefault()
    if (event.repeat) return
    start()
  }

  function handleKeyUp(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return
    event.preventDefault()
    cancel()
  }

  const remaining = Math.max(1, Math.ceil(seconds * (1 - progress)))
  const circumference = 2 * Math.PI * 9

  return (
    <>
      <Button
        type="button"
        variant={variant}
        disabled={disabled}
        aria-label={`${label}. Maintenir le bouton appuyé pendant ${seconds} secondes pour confirmer.`}
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        // Le doigt qui glisse hors du bouton, la fenêtre qui perd le focus
        // alors qu'une touche est encore enfoncée : dans les deux cas le
        // relâchement n'arrive jamais, il faut annuler soi-même.
        onBlur={cancel}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        // Sur Android, l'appui long ouvre le menu contextuel et vole le geste.
        onContextMenu={(event) => event.preventDefault()}
        className={cn(
          // Largeur minimale figée : le libellé change au moment du maintien
          // et le décompte perd un chiffre en route. Sans cela le bouton
          // rétrécirait sous le doigt qui est en train de le tenir.
          "relative h-11 min-w-[13.5rem] select-none overflow-hidden px-4 font-semibold",
          // `touch-none` empêche le navigateur mobile d'interpréter le maintien
          // comme un défilement et d'annuler le pointeur en cours de route.
          "touch-none",
          className,
        )}
      >
        {/* Remplissage qui progresse sous le libellé. `bg-current` suit la
            couleur du texte du bouton : lisible sur rouge plein comme sur
            un contour clair, en thème clair comme en sombre. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 bg-current opacity-25 transition-[width] duration-75 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />

        <span className="relative z-10 flex items-center gap-2">
          {/* Anneau de progression. Le décompte chiffré est posé dans le
              libellé plutôt qu'au centre de l'anneau : un chiffre de neuf
              pixels ne se lit pas sur un écran d'entrée de gamme en plein
              soleil, alors qu'un « 4 s » à la taille du texte se lit. */}
          <svg viewBox="0 0 24 24" className="-rotate-90" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-30"
            />
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
            />
          </svg>
          <span className="truncate">
            {holding ? `${holdingLabel} · ${remaining} s` : label}
          </span>
        </span>
      </Button>

      {/* Le décompte doit être entendu, pas seulement vu. `assertive` parce
          qu'un compte à rebours périmé n'a plus aucune valeur : chaque
          annonce doit remplacer la précédente. */}
      <span role="status" aria-live="assertive" className="sr-only">
        {holding ? `Maintenez encore ${remaining} seconde${remaining > 1 ? "s" : ""}.` : ""}
      </span>
    </>
  )
}
