"use client"

import { useState } from "react"
import { Eye, Loader2 } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { openPdfPreview } from "@/lib/pdf/preview"

interface PdfPreviewButtonProps {
  /** Récupère le blob PDF (même source que le téléchargement). */
  fetchBlob: () => Promise<Blob>
  /** Complément d'aria-label, ex. « le bulletin de Traoré Aminata ». */
  label?: string
  disabled?: boolean
  className?: string
  variant?: ButtonProps["variant"]
  size?: ButtonProps["size"]
  /** Icône seule, pour les barres d'actions compactes (tableaux). */
  iconOnly?: boolean
}

/**
 * Bouton « Aperçu » à placer à côté d'un bouton de téléchargement PDF.
 * Ouvre le même blob en aperçu inline (nouvel onglet) sans refaire l'auth.
 */
export function PdfPreviewButton({
  fetchBlob,
  label,
  disabled,
  className,
  variant = "outline",
  size,
  iconOnly = false,
}: PdfPreviewButtonProps) {
  const [previewing, setPreviewing] = useState(false)

  async function handlePreview() {
    setPreviewing(true)
    try {
      await openPdfPreview(fetchBlob)
    } finally {
      setPreviewing(false)
    }
  }

  const suffix = label ? ` ${label}` : ""

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handlePreview}
      disabled={disabled || previewing}
      aria-label={`Aperçu${suffix}`}
      title={iconOnly ? "Aperçu du PDF" : undefined}
      className={className}
    >
      {previewing ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Eye className="h-4 w-4" aria-hidden="true" />
      )}
      {iconOnly ? <span className="sr-only">Aperçu du PDF{suffix}</span> : "Aperçu"}
    </Button>
  )
}
