"use client"

import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { settingsApi } from "@/lib/api/settings"
import { settingsKeys } from "@/lib/hooks/useSettings"
import { getUploadUrl } from "@/lib/utils"

// Mêmes bornes que la validation des photos élève (lib/photo/camera.ts) et que
// le plafond appliqué par le backend : on refuse avant d'occuper le réseau.
const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_LOGO_BYTES = 5 * 1024 * 1024

function validateLogoFile(file: File): string | null {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    return "Format invalide. Utilisez une image JPEG, PNG ou WebP."
  }
  if (file.size > MAX_LOGO_BYTES) {
    return "Cette image dépasse 5 Mo. Choisissez un fichier plus léger."
  }
  return null
}

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
    const validationError = validateLogoFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    upload.mutate(file)
  }

  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Logo de l&apos;établissement
      </Label>

      <div className="mt-3 flex flex-col gap-4 rounded-xl border border-dashed border-border bg-muted/20 p-4 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt="Logo actuel de l'établissement"
              className="h-full w-full object-contain p-1.5"
            />
          ) : (
            <ImagePlus className="h-6 w-6 text-slate-300" aria-hidden />
          )}
        </div>

        <div className="w-full min-w-0 flex-1">
          <p className="text-sm font-medium">
            {logoSrc ? "Logo actuel" : "Aucun logo enregistré"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            JPEG, PNG ou WebP, 5 Mo au maximum. Fond transparent recommandé.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="h-11 sm:h-10"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              {upload.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="h-4 w-4" aria-hidden />
              )}
              {upload.isPending ? "Envoi…" : logoSrc ? "Remplacer le logo" : "Importer un logo"}
            </Button>

            {logoSrc && (
              <Button
                type="button"
                variant="outline"
                className="h-11 sm:h-10"
                disabled={busy}
                onClick={() => remove.mutate()}
              >
                {remove.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
                {remove.isPending ? "Suppression…" : "Retirer"}
              </Button>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2"
            >
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          handleSelect(event.target.files?.[0] ?? null)
          // Réinitialise l'input pour pouvoir re-choisir le même fichier après un échec.
          event.target.value = ""
        }}
      />
    </div>
  )
}
