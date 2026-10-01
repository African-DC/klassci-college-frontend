"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SectionCard } from "@/components/admin/students/tabs/_primitives"
import { PdfPreviewButton } from "@/components/shared/PdfPreviewButton"
import { cn } from "@/lib/utils"
import {
  fetchClassAttendanceSheet,
  fetchClassCahierTexte,
  fetchClassGradeSheet,
  fetchClassRoster,
  fetchClassSynthesis,
  fileSafeName,
  triggerBlobDownload,
} from "./class-downloads"
import { ClassRosterExcelButton } from "./ClassRosterExcelButton"
import { InformationSheetDocRow } from "../information-sheet/InformationSheetDocRow"

/**
 * Ligne « document PDF » : titre + description, avec un couple d'actions
 * Aperçu / Télécharger pointant sur la même source de blob.
 */
function DocRow({
  title,
  description,
  fetchBlob,
  filename,
  label,
  accent,
  extra,
}: {
  title: string
  description: string
  fetchBlob: () => Promise<Blob>
  filename: string
  label: string
  accent?: boolean
  /** Une action de plus, à côté du PDF (la version Excel d'une liste). */
  extra?: React.ReactNode
}) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      triggerBlobDownload(await fetchBlob(), filename)
    } catch (err) {
      toast.error("Téléchargement impossible", {
        description: err instanceof Error ? err.message : "Erreur lors de la génération du PDF",
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <PdfPreviewButton
          fetchBlob={fetchBlob}
          label={label}
          className="h-11 w-full sm:h-10 sm:w-auto"
        />
        <Button
          onClick={handleDownload}
          disabled={downloading}
          variant={accent ? "default" : "outline"}
          aria-label={`Télécharger ${label}`}
          className={cn(
            "h-11 w-full sm:h-10 sm:w-auto",
            accent && "bg-accent text-accent-foreground shadow-sm hover:bg-accent/90",
          )}
        >
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Télécharger
        </Button>
        {extra}
      </div>
    </div>
  )
}

interface ClassDocumentsSectionProps {
  classId: number
  name: string
  /** Année tirée de l'emploi du temps : sans elle, pas de synthèse. */
  academicYearId: number | undefined
}

/** Les documents de la classe : PDF officiels, liste et fiche de renseignements en Excel. */
export function ClassDocumentsSection({ classId, name, academicYearId }: ClassDocumentsSectionProps) {
  const [trimester, setTrimester] = useState("1")
  const [downloadingSynthesis, setDownloadingSynthesis] = useState(false)
  const safeName = fileSafeName(name)

  const fetchSynthesis = () =>
    fetchClassSynthesis(classId, Number(trimester), academicYearId as number)

  async function handleSynthesis() {
    if (!academicYearId) return
    setDownloadingSynthesis(true)
    try {
      const blob = await fetchSynthesis()
      triggerBlobDownload(blob, `synthese-${safeName}-T${trimester}.pdf`)
    } catch (err) {
      toast.error("Téléchargement impossible", {
        description: err instanceof Error ? err.message : "Erreur lors de la génération du PDF",
      })
    } finally {
      setDownloadingSynthesis(false)
    }
  }

  return (
    <SectionCard
      icon={<FileText className="h-4 w-4" />}
      title="Documents"
      description="Générer les documents officiels de la classe au format PDF, et la liste de classe en Excel."
    >
      <div className="space-y-3">
        {/* Liste de classe (roster) */}
        <DocRow
          title="Liste de classe"
          description="Les élèves inscrits, avec matricule et coordonnées."
          fetchBlob={() => fetchClassRoster(classId)}
          filename={`liste-classe-${safeName}.pdf`}
          label={`la liste de la classe ${name}`}
          accent
          extra={<ClassRosterExcelButton classId={classId} className={name} />}
        />

        <InformationSheetDocRow classId={classId} className={name} />

        {/* Feuille d'appel (présences vierges) */}
        <DocRow
          title="Feuille d'appel"
          description="Grille de présences vierge à cocher pour l'appel en classe."
          fetchBlob={() => fetchClassAttendanceSheet(classId)}
          filename={`feuille-appel-${safeName}.pdf`}
          label={`la feuille d'appel de la classe ${name}`}
        />

        {/* Feuille de notes (grille de saisie vierge) */}
        <DocRow
          title="Feuille de notes"
          description="Grille de saisie des notes vierge pour les enseignants."
          fetchBlob={() => fetchClassGradeSheet(classId)}
          filename={`feuille-notes-${safeName}.pdf`}
          label={`la feuille de notes de la classe ${name}`}
        />

        {/* Cahier de texte (semaine en cours) */}
        <DocRow
          title="Cahier de texte"
          description="Le cahier de texte de la classe pour la semaine en cours."
          fetchBlob={() => fetchClassCahierTexte(classId)}
          filename={`cahier-texte-${safeName}.pdf`}
          label={`le cahier de texte de la classe ${name}`}
        />

        {/* Rapport de synthèse */}
        {academicYearId ? (
          <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Rapport de synthèse</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Moyennes et classement de la classe pour un trimestre.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={trimester} onValueChange={setTrimester}>
                <SelectTrigger className="h-11 w-full sm:h-10 sm:w-[140px]" aria-label="Trimestre">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Trimestre 1</SelectItem>
                  <SelectItem value="2">Trimestre 2</SelectItem>
                  <SelectItem value="3">Trimestre 3</SelectItem>
                </SelectContent>
              </Select>
              <PdfPreviewButton
                fetchBlob={fetchSynthesis}
                label={`la synthèse de la classe ${name} (T${trimester})`}
                className="h-11 w-full sm:h-10 sm:w-auto"
              />
              <Button
                variant="outline"
                onClick={handleSynthesis}
                disabled={downloadingSynthesis}
                aria-label={`Télécharger la synthèse de la classe ${name}`}
                className="h-11 w-full sm:h-10 sm:w-auto"
              >
                {downloadingSynthesis ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                Télécharger
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">
              Le rapport de synthèse sera disponible dès qu'un emploi du temps sera défini pour la classe (année académique requise).
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  )
}
