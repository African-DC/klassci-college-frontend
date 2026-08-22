"use client"

import { useCallback, useState } from "react"
import { Download, Eye, FileCheck2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { PageHero, heroAccentBtn, heroGlassBtn } from "@/components/shared/PageHero"
import { ReportsNav } from "../ReportsNav"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { useCurrentAcademicYearId } from "@/lib/hooks/useCurrentAcademicYear"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { deepReportApi } from "@/lib/api/deep-report"
import { openPdfPreview } from "@/lib/pdf/preview"
import { downloadBlob } from "@/lib/utils"

const TRIMESTRES = [1, 2, 3] as const

export function DeepReportPageClient() {
  const { has, isLoading: permissionsLoading } = usePermissions()
  const { data: academicYearsData, isLoading: yearsLoading } = useAcademicYears()
  const academicYears = academicYearsData?.items

  const [academicYearId, setAcademicYearId] = useState<number | undefined>(undefined)
  const [trimester, setTrimester] = useState<number>(1)
  const [downloading, setDownloading] = useState(false)
  const [previewing, setPreviewing] = useState(false)

  // L'année en cours d'abord : c'est celle qu'on dépose neuf fois sur dix.
  const { academicYearId: activeYearId } = useCurrentAcademicYearId(academicYearId)
  const activeYear = academicYears?.find((y) => y.id === activeYearId)

  const handleDownload = useCallback(async () => {
    if (!activeYearId) return
    setDownloading(true)
    try {
      const blob = await deepReportApi.downloadPdf(activeYearId, trimester)
      downloadBlob(blob, `rapport-deep-trimestre-${trimester}-${activeYearId}.pdf`)
      toast.success(`Rapport du trimestre ${trimester} téléchargé`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de générer le rapport",
      )
    } finally {
      setDownloading(false)
    }
  }, [activeYearId, trimester])

  const handlePreview = useCallback(async () => {
    if (!activeYearId) return
    setPreviewing(true)
    try {
      await openPdfPreview(() => deepReportApi.downloadPdf(activeYearId, trimester))
    } finally {
      setPreviewing(false)
    }
  }, [activeYearId, trimester])

  if (!permissionsLoading && !has("reports:read")) {
    return (
      <div className="space-y-6">
        <ReportsNav current="deep" />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-base font-medium text-foreground">Accès refusé</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Le rapport de fin de trimestre est réservé à la direction. Demandez le
              droit « Consulter les rapports » à votre administrateur.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pretA = Boolean(activeYearId)

  return (
    <div className="space-y-6">
      <PageHero
        icon={FileCheck2}
        title="Rapport de fin de trimestre"
        subtitle="Le canevas officiel de la DEEP, ses vingt-sept tableaux remplis depuis vos données. Les tableaux qu'aucun écran ne permet encore de renseigner portent la mention « à compléter manuellement » plutôt qu'une grille de zéros."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePreview}
              disabled={!pretA || previewing}
              className={heroGlassBtn}
            >
              {previewing ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Eye aria-hidden="true" className="h-4 w-4" />
              )}
              Aperçu
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!pretA || downloading}
              className={heroAccentBtn}
            >
              {downloading ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Download aria-hidden="true" className="h-4 w-4" />
              )}
              Télécharger le rapport
            </button>
          </div>
        }
      />

      <ReportsNav current="deep" />

      <Card>
        <CardContent className="grid gap-4 py-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="deep-annee"
              className="text-sm font-medium text-foreground"
            >
              Année scolaire
            </label>
            <Select
              value={activeYearId ? String(activeYearId) : undefined}
              onValueChange={(v) => setAcademicYearId(Number(v))}
              disabled={yearsLoading || !academicYears?.length}
            >
              <SelectTrigger id="deep-annee" className="h-11">
                <SelectValue
                  placeholder={yearsLoading ? "Chargement…" : "Choisir une année"}
                />
              </SelectTrigger>
              <SelectContent>
                {(academicYears ?? []).map((y) => (
                  <SelectItem key={y.id} value={String(y.id)}>
                    {y.name}
                    {y.is_current ? " (en cours)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="deep-trimestre"
              className="text-sm font-medium text-foreground"
            >
              Trimestre
            </label>
            <Select
              value={String(trimester)}
              onValueChange={(v) => setTrimester(Number(v))}
            >
              <SelectTrigger id="deep-trimestre" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIMESTRES.map((t) => (
                  <SelectItem key={t} value={String(t)}>
                    Trimestre {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!yearsLoading && !academicYears?.length ? (
            <p className="sm:col-span-2 text-sm text-muted-foreground">
              Aucune année scolaire n'est encore créée. Ouvrez-en une depuis
              Paramètres pour pouvoir produire le rapport.
            </p>
          ) : (
            <p className="sm:col-span-2 text-sm text-muted-foreground">
              Le document sera produit pour {activeYear?.name ?? "l'année choisie"},
              trimestre {trimester}. Comptez quelques secondes : les vingt-sept
              tableaux sont calculés à la demande.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
