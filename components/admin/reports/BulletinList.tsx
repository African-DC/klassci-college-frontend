"use client"

import { useState, useMemo, useCallback } from "react"
import { Eye, Download, Send, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
import { getMentionColor, downloadBlob } from "@/lib/utils"
import { BulletinStatusSchema } from "@/lib/contracts/bulletin"
import type { BulletinListParams, Bulletin } from "@/lib/contracts/bulletin"

interface BulletinListProps {
  params: BulletinListParams
  onPageChange?: (page: number) => void
}

export function BulletinList({ params, onPageChange }: BulletinListProps) {
  const { data, isLoading, isError } = useBulletins(params)
  const { mutate: publish, isPending: isPublishing } = usePublishBulletins()
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const handleDownloadPdf = useCallback(async (bulletin: Bulletin) => {
    setDownloadingId(bulletin.id)
    try {
      const blob = await bulletinsApi.downloadPdf(bulletin.id)
      downloadBlob(blob, `bulletin-${bulletin.student_name}.pdf`)
    } catch (err) {
      toast.error("Erreur lors du téléchargement", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      })
    } finally {
      setDownloadingId(null)
    }
  }, [])

  const bulletins = useMemo(() => data?.data ?? [], [data])
  const hasDrafts = useMemo(
    () => bulletins.some((b) => b.status === BulletinStatusSchema.Values.brouillon),
    [bulletins],
  )

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
    if (!params.class_id || !params.trimester) return
    publish({ classId: params.class_id, trimester: params.trimester })
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

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Élève</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead className="text-center">Moyenne</TableHead>
              <TableHead className="text-center">Rang</TableHead>
              <TableHead>Mention</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bulletins.map((bulletin: Bulletin) => (
              <TableRow key={bulletin.id}>
                <TableCell className="font-medium">{bulletin.student_name}</TableCell>
                <TableCell>{bulletin.class_name}</TableCell>
                <TableCell className="text-center font-semibold">
                  {bulletin.average !== null ? bulletin.average.toFixed(2) : "—"}
                </TableCell>
                <TableCell className="text-center">
                  {bulletin.rank ?? "—"}/{bulletin.total_students}
                </TableCell>
                <TableCell>
                  <span className={`font-medium ${getMentionColor(bulletin.mention)}`}>
                    {bulletin.mention ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <BulletinStatusBadge status={bulletin.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPreviewId(bulletin.id)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Voir le bulletin de {bulletin.student_name}</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownloadPdf(bulletin)}
                      disabled={downloadingId === bulletin.id}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Télécharger le bulletin de {bulletin.student_name}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{data?.total ?? 0} bulletin(s)</span>
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
          <span>Page {data?.page ?? 1}/{data?.total_pages ?? 1}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={!data || data.page >= data.total_pages}
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
