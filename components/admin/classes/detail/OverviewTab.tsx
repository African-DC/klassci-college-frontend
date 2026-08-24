"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  BookOpen,
  Download,
  DoorOpen,
  FileText,
  GraduationCap,
  Loader2,
  School,
  Users,
} from "lucide-react"
import type { Class } from "@/lib/contracts/class"
import type { TimetableSlot } from "@/lib/contracts/timetable"
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
import { deriveSubjects, deriveTeachers } from "./class-helpers"
import {
  fetchClassAttendanceSheet,
  fetchClassCahierTexte,
  fetchClassGradeSheet,
  fetchClassRoster,
  fetchClassSynthesis,
  fileSafeName,
  triggerBlobDownload,
} from "./class-downloads"

interface OverviewTabProps {
  classData: Class
  slots: TimetableSlot[]
}

function MetricTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="mt-1 text-2xl font-bold leading-none tracking-tight tabular-nums">
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  )
}

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
}: {
  title: string
  description: string
  fetchBlob: () => Promise<Blob>
  filename: string
  label: string
  accent?: boolean
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
      </div>
    </div>
  )
}

export function OverviewTab({ classData, slots }: OverviewTabProps) {
  const [trimester, setTrimester] = useState("1")
  const [downloadingSynthesis, setDownloadingSynthesis] = useState(false)

  const enrolled = classData.enrolled_count ?? 0
  const max = classData.max_students ?? 0
  const ratio = max > 0 ? Math.round((enrolled / max) * 100) : 0
  const available = max > 0 ? Math.max(max - enrolled, 0) : 0

  const subjectsCount = deriveSubjects(slots).length
  const teachersCount = deriveTeachers(slots).length
  const academicYearId = slots[0]?.academic_year_id

  const name = classData.name
  const safeName = fileSafeName(name)

  const fetchSynthesis = () =>
    fetchClassSynthesis(classData.id, Number(trimester), academicYearId as number)

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

  const barTone =
    ratio > 95 ? "bg-rose-500" : ratio >= 80 ? "bg-amber-500" : "bg-emerald-500"

  return (
    <div className="space-y-5">
      <SectionCard icon={<School className="h-4 w-4" />} title="Synthèse de la classe">
        {/* Capacité avec barre de remplissage */}
        <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Effectif inscrit
              </p>
              <p className="mt-1 text-3xl font-bold leading-none tracking-tight tabular-nums">
                {enrolled}
                <span className="ml-1 text-base font-medium text-muted-foreground">
                  / {max || "—"}
                </span>
              </p>
            </div>
            <span className="text-2xl font-bold tabular-nums text-[#F58220]">{ratio}%</span>
          </div>
          {max > 0 && (
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${barTone}`}
                style={{ width: `${Math.min(ratio, 100)}%` }}
                role="progressbar"
                aria-valuenow={ratio}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Taux de remplissage : ${ratio}%`}
              />
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {max > 0 ? `${available} place${available > 1 ? "s" : ""} disponible${available > 1 ? "s" : ""}` : "Capacité non définie"}
          </p>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            icon={GraduationCap}
            label="Niveau"
            value={classData.level_name ?? "—"}
            hint={classData.series_name ? `Série ${classData.series_name}` : undefined}
          />
          <MetricTile
            icon={DoorOpen}
            label="Salle"
            value={classData.room_id ? `Salle ${name}` : "—"}
            hint={classData.room_id ? "Salle attitrée" : "Aucune salle"}
          />
          <MetricTile
            icon={BookOpen}
            label="Matières"
            value={subjectsCount}
            hint="enseignées (via l'EDT)"
          />
          <MetricTile
            icon={Users}
            label="Enseignants"
            value={teachersCount}
            hint="intervenant dans la classe"
          />
        </div>
      </SectionCard>

      {/* Documents PDF */}
      <SectionCard
        icon={<FileText className="h-4 w-4" />}
        title="Documents"
        description="Générer les documents officiels de la classe au format PDF."
      >
        <div className="space-y-3">
          {/* Liste de classe (roster) */}
          <DocRow
            title="Liste de classe"
            description="Les élèves inscrits, avec matricule et coordonnées."
            fetchBlob={() => fetchClassRoster(classData.id)}
            filename={`liste-classe-${safeName}.pdf`}
            label={`la liste de la classe ${name}`}
            accent
          />

          {/* Feuille d'appel (présences vierges) */}
          <DocRow
            title="Feuille d'appel"
            description="Grille de présences vierge à cocher pour l'appel en classe."
            fetchBlob={() => fetchClassAttendanceSheet(classData.id)}
            filename={`feuille-appel-${safeName}.pdf`}
            label={`la feuille d'appel de la classe ${name}`}
          />

          {/* Feuille de notes (grille de saisie vierge) */}
          <DocRow
            title="Feuille de notes"
            description="Grille de saisie des notes vierge pour les enseignants."
            fetchBlob={() => fetchClassGradeSheet(classData.id)}
            filename={`feuille-notes-${safeName}.pdf`}
            label={`la feuille de notes de la classe ${name}`}
          />

          {/* Cahier de texte (semaine en cours) */}
          <DocRow
            title="Cahier de texte"
            description="Le cahier de texte de la classe pour la semaine en cours."
            fetchBlob={() => fetchClassCahierTexte(classData.id)}
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
    </div>
  )
}
