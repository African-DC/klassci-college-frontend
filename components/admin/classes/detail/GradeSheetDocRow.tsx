"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, Loader2, RectangleHorizontal, RectangleVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PdfPreviewButton } from "@/components/shared/PdfPreviewButton"
import { cn } from "@/lib/utils"
import {
  fetchClassGradeSheet,
  fileSafeName,
  triggerBlobDownload,
  type GradeSheetOrientation,
} from "./class-downloads"

interface GradeSheetDocRowProps {
  classId: number
  className: string
}

const choices: { value: GradeSheetOrientation; title: string; Icon: typeof RectangleHorizontal }[] = [
  { value: "landscape", title: "Paysage", Icon: RectangleHorizontal },
  { value: "portrait", title: "Portrait", Icon: RectangleVertical },
]

/** Choix de mise en page propre à la feuille de notes, sans modifier les autres exports. */
export function GradeSheetDocRow({ classId, className }: GradeSheetDocRowProps) {
  const [orientation, setOrientation] = useState<GradeSheetOrientation>("landscape")
  const [downloading, setDownloading] = useState(false)
  const safeName = fileSafeName(className)
  const fetchBlob = () => fetchClassGradeSheet(classId, orientation)

  async function handleDownload() {
    setDownloading(true)
    try {
      const blob = await fetchBlob()
      triggerBlobDownload(blob, `feuille-notes-${safeName}-${orientation}.pdf`)
    } catch (error) {
      toast.error("Téléchargement impossible", {
        description: error instanceof Error ? error.message : "Erreur lors de la génération du PDF",
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/40 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">Feuille de notes</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Grille vierge à remplir à la main · A4 {orientation === "portrait" ? "vertical" : "horizontal"}.
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
        <div
          role="group"
          aria-label="Orientation de la feuille de notes"
          className="inline-flex h-11 w-full items-center gap-1 rounded-lg border border-border/70 bg-background/70 p-1 sm:h-10 sm:w-auto"
        >
          {choices.map(({ value, title, Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={orientation === value}
              onClick={() => setOrientation(value)}
              className={cn(
                "inline-flex h-full min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors sm:flex-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                orientation === value
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {title}
            </button>
          ))}
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
          <PdfPreviewButton
            fetchBlob={fetchBlob}
            label={`la feuille de notes de la classe ${className} en ${orientation === "portrait" ? "portrait" : "paysage"}`}
            className="h-11 w-full sm:h-10 sm:w-auto"
          />
          <Button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            variant="outline"
            aria-label={`Télécharger la feuille de notes de la classe ${className} en ${orientation === "portrait" ? "portrait" : "paysage"}`}
            className="h-11 w-full sm:h-10 sm:w-auto"
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            Télécharger
          </Button>
        </div>
      </div>
    </div>
  )
}
