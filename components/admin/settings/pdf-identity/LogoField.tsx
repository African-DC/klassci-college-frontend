"use client"

import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AlertCircle, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { settingsApi } from "@/lib/api/settings"
import { settingsKeys } from "@/lib/hooks/useSettings"
import { validatePhotoFile } from "@/lib/photo/camera"
import { getUploadUrl } from "@/lib/utils"

const LOGO_INPUT_ID = "school-logo-input"

interface LogoFieldProps {
  logoUrl: string | null
  /** Averti après un envoi ou un retrait réussi, pour rafraîchir l'aperçu. */
  onLogoChanged: () => void
}

export function LogoField({ logoUrl, onLogoChanged }: LogoFieldProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const logoSrc = getUploadUrl(logoUrl)

  // Invalidation ciblée : la clé "settings" alimente l'aperçu en direct de cet
  // onglet et tous les écrans qui lisent l'identité de l'établissement.
  const refreshSettings = () => queryClient.invalidateQueries({ queryKey: settingsKeys.all })

  const upload = useMutation({
    mutationFn: (file: File) => settingsApi.uploadLogo(file),
    onSuccess: async () => {
      setError(null)
      onLogoChanged()
      await refreshSettings()
      toast.success("Logo enregistré", {
        description: "Il apparaîtra en tête des prochains documents officiels.",
      })
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Envoi impossible"
      setError(message)
      toast.error("Échec de l'envoi du logo", { description: message })
    },
  })

  const remove = useMutation({
    mutationFn: () => settingsApi.deleteLogo(),
    onSuccess: async () => {
      setError(null)
      onLogoChanged()
      await refreshSettings()
      toast.success("Logo retiré", {
        description: "Les documents repartiront sans logo tant qu'aucun autre n'est envoyé.",
      })
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Suppression impossible"
      setError(message)
      toast.error("Échec de la suppression du logo", { description: message })
    },
  })

  const busy = upload.isPending || remove.isPending

  function handleSelect(file: File | null) {
    if (!file) return
    // Mêmes bornes que les photos élève, appliquées avant d'occuper le réseau.
    const validationError = validatePhotoFile(file, "image")
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    upload.mutate(file)
  }

  return (
    <div>
      <Label
        htmlFor={LOGO_INPUT_ID}
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Logo de l&apos;établissement
      </Label>

      <div
        aria-busy={busy}
        className="mt-3 flex flex-col gap-4 rounded-xl border border-dashed border-border bg-muted/20 p-4 sm:flex-row sm:items-center"
      >
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt="Logo actuel de l'établissement"
              className="h-full w-full object-contain p-1.5"
            />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden />
          )}
        </div>

        <div className="w-full min-w-0 flex-1">
          <p className="text-sm font-medium">{logoSrc ? "Logo actuel" : "Aucun logo enregistré"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            JPEG, PNG ou WebP, 5 Mo au maximum. Fond transparent recommandé.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:h-10 sm:w-auto"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              {upload.isPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <ImagePlus aria-hidden />
              )}
              {upload.isPending ? "Envoi en cours…" : logoSrc ? "Remplacer le logo" : "Importer un logo"}
            </Button>

            {logoSrc && (
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full sm:h-10 sm:w-auto"
                disabled={busy}
                onClick={() => remove.mutate()}
              >
                {remove.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
                {remove.isPending ? "Suppression…" : "Retirer"}
              </Button>
            )}
          </div>

          {/* Le message porte l'information : la couleur ne fait que la souligner. */}
          {error && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
              <p className="min-w-0 break-words text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </div>

      <input
        id={LOGO_INPUT_ID}
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={busy}
        onChange={(event) => {
          handleSelect(event.target.files?.[0] ?? null)
          // Réinitialise l'input pour pouvoir re-choisir le même fichier après un échec.
          event.target.value = ""
        }}
      />
    </div>
  )
}
