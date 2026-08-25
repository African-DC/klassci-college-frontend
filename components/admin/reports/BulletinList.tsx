"use client"

import { useState, useMemo, useCallback } from "react"
import { Download, DownloadCloud, Send, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PdfPreviewButton } from "@/components/shared/PdfPreviewButton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BulletinStatusBadge } from "./BulletinStatusBadge"
import { BulletinPreviewModal } from "./BulletinPreviewModal"
import { BulletinListSkeleton } from "./BulletinListSkeleton"
import { useBulletins, usePublishBulletins } from "@/lib/hooks/useBulletins"
import { bulletinsApi } from "@/lib/api/bulletins"
import { cn, downloadBlob, getUploadUrl } from "@/lib/utils"
import { getMentionBadgeClass } from "./mention"
import type { BulletinListParams, Bulletin } from "@/lib/contracts/bulletin"

function StudentInitialsAvatar({
  name,
  photoUrl,
}: {
  name: string
  photoUrl?: string | null
}) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?"
  const photoSrc = getUploadUrl(photoUrl ?? undefined)
  if (photoSrc) {
    return (
      <img
        src={photoSrc}
        alt={name}
        className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover"
      />
    )
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-primary/10">
      <span className="text-xs font-semibold text-primary">{initials}</span>
    </div>
  )
}

interface BulletinListProps {
  params: BulletinListParams
  onPageChange?: (page: number) => void
}

export function BulletinList({ params, onPageChange }: BulletinListProps) {
  const { data, isLoading, isError } = useBulletins(params)
  // Le bandeau « publiez-les » doit parler de la classe entière, pas de la
  // page affichée : une seule ligne suffit, c'est le `total` de l'enveloppe
  // qui répond.
  const { data: draftsProbe } = useBulletins({
    ...params,
    is_published: false,
    page: 1,
    size: 1,
  })
  const { mutate: publish, isPending: isPublishing } = usePublishBulletins()
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)

  const handleDownloadPdf = useCallback(async (bulletin: Bulletin) => {
    setDownloadingId(bulletin.id)
    try {
      const blob = await bulletinsApi.downloadPdf(bulletin.id)
      downloadBlob(blob, `bulletin-${bulletin.id}.pdf`)
    } catch (err) {
      toast.error("Erreur lors du téléchargement", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      })
    } finally {
      setDownloadingId(null)
    }
  }, [])

  const bulletins = useMemo(() => data?.items ?? [], [data])
  const hasDrafts = (draftsProbe?.total ?? 0) > 0
  // `total` vient de l'enveloppe : il compte les bulletins de la classe et
  // du trimestre choisis, pas les lignes de la page affichée.
  const schoolTotal = data?.total ?? 0
  const isPaged = schoolTotal > bulletins.length

  const handleDownloadAll = useCallback(async () => {
    if (bulletins.length === 0) return
    setIsDownloadingAll(true)
    let downloaded = 0
    try {
      for (const bulletin of bulletins) {
        const blob = await bulletinsApi.downloadPdf(bulletin.id)
        downloadBlob(blob, `bulletin-${bulletin.id}.pdf`)
        downloaded++
      }
      toast.success(`${downloaded} bulletin(s) téléchargé(s)`)
    } catch (err) {
      toast.error("Erreur lors du téléchargement", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      })
    } finally {
      setIsDownloadingAll(false)
    }
  }, [bulletins])

  if (isLoading) return <BulletinListSkeleton />

  if (isError) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Impossible de charger les bulletins.
      </div>
    )
  }

  if (bulletins.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun bulletin trouvé pour les critères sélectionnés.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Utilisez le bouton &quot;Générer les bulletins&quot; pour créer les bulletins.
        </p>
      </div>
    )
  }

  function handlePublish() {
    if (!params.class_id || !params.trimester || !params.academic_year_id) return
    publish({
      classId: params.class_id,
      trimester: params.trimester,
      academicYearId: params.academic_year_id,
    })
  }

  return (
    <div className="space-y-4">
      {hasDrafts && params.class_id && params.trimester && (
        <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 p-3">
          <p className="text-sm">
            Des bulletins sont en <strong>brouillon</strong>. Publiez-les pour les rendre visibles aux parents.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            <Send className="mr-2 h-3 w-3" />
            {isPublishing ? "Publication..." : "Publier tout"}
          </Button>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownloadAll}
          disabled={isDownloadingAll || bulletins.length === 0}
        >
          {isDownloadingAll ? (
            <>
              <Download className="mr-2 h-3 w-3 animate-spin" />
              Téléchargement...
            </>
          ) : (
            <>
              <DownloadCloud className="mr-2 h-3 w-3" />
              {/* Le bouton ne télécharge que ce qui est chargé : le dire
                  plutôt que promettre « tout » sur une liste paginée. */}
              {isPaged ? "Télécharger cette page" : "Télécharger tout"}
            </>
          )}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="py-3">Élève</TableHead>
              <TableHead className="text-center">Moyenne</TableHead>
              <TableHead className="text-center">Rang</TableHead>
              <TableHead>Mention</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bulletins.map((bulletin: Bulletin) => {
              const avg =
                bulletin.average !== null ? Number(bulletin.average).toFixed(2) : null
              const rankLabel =
                bulletin.rank !== null && bulletin.total_students > 0
                  ? `${bulletin.rank} / ${bulletin.total_students}`
                  : bulletin.rank !== null
                    ? String(bulletin.rank)
                    : "—"
              return (
                <TableRow
                  key={bulletin.id}
                  className="cursor-pointer transition-colors hover:bg-muted/30"
                  onClick={() => setPreviewId(bulletin.id)}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <StudentInitialsAvatar
                        name={bulletin.student_name}
                        photoUrl={bulletin.student_photo_url}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {bulletin.student_name || "—"}
                        </p>
                        {bulletin.student_enrollment_number && (
                          <p className="truncate text-xs text-muted-foreground">
                            {bulletin.student_enrollment_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {avg !== null ? (
                      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                        {avg}
                        <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                          /20
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "font-mono text-sm tabular-nums",
                        bulletin.rank === 1 && "font-semibold text-emerald-700",
                      )}
                    >
                      {rankLabel}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={getMentionBadgeClass(bulletin.mention)}>
                      {bulletin.mention ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <BulletinStatusBadge isPublished={bulletin.is_published} />
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <PdfPreviewButton
                        fetchBlob={() => bulletinsApi.downloadPdf(bulletin.id)}
                        label={`le bulletin de ${bulletin.student_name}`}
                        iconOnly
                        size="icon"
                        variant="ghost"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDownloadPdf(bulletin)}
                        disabled={downloadingId === bulletin.id}
                        title="Télécharger le PDF"
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">
                          Télécharger le bulletin de {bulletin.student_name}
                        </span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{schoolTotal} bulletin(s)</span>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={!data || data.page <= 1}
            onClick={() => onPageChange?.(Math.max(1, (data?.page ?? 1) - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Page précédente</span>
          </Button>
          <span>Page {data?.page ?? 1}/{data && data.size > 0 ? Math.ceil(data.total / data.size) : 1}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={!data || data.size <= 0 || data.page >= Math.ceil(data.total / data.size)}
            onClick={() => onPageChange?.((data?.page ?? 1) + 1)}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Page suivante</span>
          </Button>
        </div>
      </div>

      <BulletinPreviewModal
        bulletinId={previewId}
        onClose={() => setPreviewId(null)}
      />
    </div>
  )
}
