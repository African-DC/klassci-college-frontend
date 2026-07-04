"use client"

import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DicteeControlsProps {
  isFirst: boolean
  isLast: boolean
  onPrev: () => void
  onAbsent: () => void
  onNext: () => void
  // Micro
  micSupported: boolean
  micSecureContext: boolean
  micListening: boolean
  micPermissionDenied: boolean
  micServiceUnavailable: boolean
  onMicToggle: () => void
  onMicRetry: () => void
}

/**
 * Contrôles bas de la dictée : navigation (précédent / absent / suivant) +
 * gestion micro. Le micro a désormais 4 états clairs et un chemin de
 * récupération (bug #282) :
 *   - non supporté     → info clavier
 *   - service KO       → info clavier + « Réessayer »
 *   - permission refusée → info + « Réessayer le micro » (auto-débloque aussi
 *     dès que l'utilisateur autorise via la Permissions API)
 *   - OK               → bouton activer / micro actif
 */
export function DicteeControls({
  isFirst,
  isLast,
  onPrev,
  onAbsent,
  onNext,
  micSupported,
  micSecureContext,
  micListening,
  micPermissionDenied,
  micServiceUnavailable,
  onMicToggle,
  onMicRetry,
}: DicteeControlsProps) {
  return (
    <div className="space-y-3 px-4 pb-6">
      {!micSupported && (
        <MicBanner tone="info">
          Reconnaissance vocale indisponible sur ce navigateur. Saisissez avec les
          boutons, ou utilisez Chrome / Edge / Safari récent.
        </MicBanner>
      )}

      {micSupported && !micSecureContext && (
        <MicBanner tone="info">
          La dictée vocale nécessite une connexion sécurisée (https). Ouvrez le
          site via https://college.klassci.com pour dicter, ou saisissez les notes
          au clavier.
        </MicBanner>
      )}

      {micSupported && micSecureContext && micServiceUnavailable && (
        <MicBanner
          tone="info"
          action={
            <RetryButton onClick={onMicRetry}>Réessayer</RetryButton>
          }
        >
          Le micro fonctionne, mais la reconnaissance vocale est bloquée par ce
          navigateur (fréquent sur Microsoft Edge). Utilisez Google Chrome pour
          dicter, ou saisissez les notes au clavier.
        </MicBanner>
      )}

      {micSupported && micSecureContext && !micServiceUnavailable && micPermissionDenied && (
        <MicBanner
          tone="danger"
          action={
            <RetryButton onClick={onMicRetry}>Réessayer le micro</RetryButton>
          }
        >
          Accès au micro refusé. Autorisez-le dans le navigateur, l&apos;activation
          se fait ensuite toute seule (ou appuyez sur « Réessayer »).
        </MicBanner>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="secondary"
          size="lg"
          onClick={onPrev}
          disabled={isFirst}
          className="h-16 bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="ml-1 hidden sm:inline">Précédent</span>
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={onAbsent}
          className="h-16 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
        >
          Absent
        </Button>

        <Button
          size="lg"
          onClick={onNext}
          className="h-16 bg-emerald-500 text-white hover:bg-emerald-600"
        >
          <span className="hidden sm:inline">{isLast ? "Récap" : "Suivant"}</span>
          {isLast ? (
            <Check className="ml-1 h-6 w-6 sm:ml-2" />
          ) : (
            <ChevronRight className="ml-1 h-6 w-6 sm:ml-2" />
          )}
        </Button>
      </div>

      {micSupported && micSecureContext && !micPermissionDenied && !micServiceUnavailable && (
        <Button
          variant="ghost"
          size="lg"
          onClick={onMicToggle}
          className={cn(
            "h-14 w-full gap-2 border text-white",
            micListening
              ? "border-accent/60 bg-accent/15 hover:bg-accent/25"
              : "border-white/20 bg-white/[0.04] hover:bg-white/10",
          )}
        >
          {micListening ? (
            <>
              <Mic className="h-5 w-5 animate-pulse text-accent" />
              <span>Micro actif — dites votre note</span>
            </>
          ) : (
            <>
              <MicOff className="h-5 w-5 opacity-60" />
              <span>Activer le micro</span>
            </>
          )}
        </Button>
      )}
    </div>
  )
}

function MicBanner({
  tone,
  action,
  children,
}: {
  tone: "info" | "danger"
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
        tone === "info" && "border-amber-400/30 bg-amber-400/10 text-amber-200",
        tone === "danger" && "border-rose-400/30 bg-rose-400/10 text-rose-200",
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{children}</span>
      {action}
    </div>
  )
}

function RetryButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/20"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      {children}
    </button>
  )
}
