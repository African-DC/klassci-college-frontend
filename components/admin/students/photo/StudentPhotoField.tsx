"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, ImagePlus, RotateCcw, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { StudentPhotoCaptureDialog } from "./StudentPhotoCaptureDialog"
import { canUseLiveCamera, downscaleImageFile, validatePhotoFile } from "@/lib/photo/camera"

interface StudentPhotoFieldProps {
  value: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}

export function StudentPhotoField({ value, onChange, disabled = false }: StudentPhotoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const captureInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [liveCamera, setLiveCamera] = useState(false)
  const [preparing, setPreparing] = useState(false)

  useEffect(() => {
    setLiveCamera(canUseLiveCamera())
  }, [])

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(value)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  async function applyFile(file: File | null) {
    if (!file) {
      setError(null)
      onChange(null)
      return
    }
    setPreparing(true)
    try {
      // La réduction passe AVANT la validation, jamais après : un JPEG sorti de
      // la galerie d'un téléphone récent pèse 4 à 6 Mo et serait refusé tel quel,
      // alors que réduit il tient en quelques dizaines de kilo-octets — ce qui
      // change aussi tout sur une connexion 3G.
      const prepared = await downscaleImageFile(file)
      const validationError = validatePhotoFile(prepared)
      if (validationError) {
        setError(validationError)
        return
      }
      setError(null)
      onChange(prepared)
    } finally {
      setPreparing(false)
    }
  }

  // Le même paragraphe porte l'aide et l'état : une seule région `aria-live`,
  // toujours montée, annonce la préparation sans décaler la mise en page.
  const helpText = preparing
    ? "Préparation de la photo…"
    : liveCamera
      ? "Ouvrez la caméra, vérifiez l'aperçu, puis enregistrez. L'import reste disponible."
      : "La caméra n'est pas disponible ici. Importez une photo JPEG, PNG ou WebP."

  return (
    <div className="space-y-3">
      {/* Sur un petit écran, l’avatar de 96px ne laissait que ~150px à la colonne
          de droite : les libellés des boutons, en whitespace-nowrap, sortaient de
          la boîte. On empile donc avatar puis actions sous le seuil sm. */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
        <Avatar className="h-20 w-20 shrink-0 ring-1 ring-border sm:h-24 sm:w-24">
          {previewUrl ? <AvatarImage src={previewUrl} alt="Aperçu de la photo élève" className="object-cover" /> : null}
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">Photo</AvatarFallback>
        </Avatar>
        <div className="w-full min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium">Photo de l&apos;élève</p>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {helpText}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              className="h-11"
              disabled={disabled || preparing || !liveCamera}
              onClick={() => setCameraOpen(true)}
            >
              <Camera className="h-4 w-4" />
              Prendre une photo
            </Button>
            {!liveCamera && (
              <Button
                type="button"
                className="h-11"
                disabled={disabled || preparing}
                onClick={() => captureInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                Ouvrir l&apos;appareil
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={disabled || preparing}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              Importer une photo
            </Button>
          </div>
        </div>
      </div>

      {value && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={disabled || preparing}
            onClick={() => void applyFile(null)}
          >
            <X className="h-4 w-4" />
            Retirer
          </Button>
          {liveCamera && (
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={disabled || preparing}
              onClick={() => setCameraOpen(true)}
            >
              <RotateCcw className="h-4 w-4" />
              Reprendre
            </Button>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!liveCamera && (
        <p className="text-xs text-muted-foreground">
          Sur HTTP ou sans permission caméra, utilisez l&apos;import de fichier. La prise directe fonctionne en HTTPS.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          void applyFile(event.target.files?.[0] ?? null)
          event.target.value = ""
        }}
      />
      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(event) => {
          void applyFile(event.target.files?.[0] ?? null)
          event.target.value = ""
        }}
      />

      <StudentPhotoCaptureDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCaptured={applyFile}
      />
    </div>
  )
}
