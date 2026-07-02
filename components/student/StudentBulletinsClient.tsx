"use client"

import { useState, useCallback } from "react"
import { Download, FileText, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/utils"
import { PdfPreviewButton } from "@/components/shared/PdfPreviewButton"
import { useStudentBulletins } from "@/lib/hooks/useStudentPortal"
import { studentPortalApi } from "@/lib/api/student-portal"
import { DataError } from "@/components/shared/DataError"
import type { StudentBulletin } from "@/lib/contracts/student-portal"

export function StudentBulletinsClient() {
  const { data: bulletins, isLoading, isError, refetch } = useStudentBulletins()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl tracking-tight">Mes bulletins</h1>
        <p className="text-sm text-muted-foreground">Bulletins scolaires publiés</p>
      </div>

      {isLoading ? (
        <BulletinsSkeleton />
      ) : isError ? (
        <DataError message="Impossible de charger les bulletins." onRetry={() => refetch()} />
      ) : !bulletins || bulletins.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 py-12 text-center">
          <FileText aria-hidden="true" className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Aucun bulletin publié pour le moment.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/80">
            Vos bulletins apparaîtront ici après publication par l&apos;administration.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bulletins.map((bulletin) => (
            <BulletinCard key={bulletin.id} bulletin={bulletin} />
          ))}
        </div>
      )}
    </div>
  )
}

function BulletinCard({ bulletin }: { bulletin: StudentBulletin }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      const blob = await studentPortalApi.downloadBulletin(bulletin.id)
      downloadBlob(blob, `bulletin-${bulletin.trimester}-${bulletin.academic_year}.pdf`)
      toast.success("Bulletin téléchargé")
    } catch (err) {
      console.error("[StudentBulletins] Download failed:", err)
      toast.error(err instanceof Error ? err.message : "Impossible de télécharger le bulletin")
    } finally {
      setIsDownloading(false)
    }
  }, [bulletin.id, bulletin.trimester, bulletin.academic_year])

  const isPublished = bulletin.status === "publie"

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText aria-hidden="true" className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{bulletin.trimester}</p>
            <p className="text-xs text-muted-foreground">{bulletin.academic_year}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {bulletin.general_average !== null && (
                <span className={`text-xs font-medium tabular-nums ${bulletin.general_average >= 10 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  Moy. {bulletin.general_average.toFixed(2)}/20
                </span>
              )}
              {bulletin.rank !== null && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  Rang {bulletin.rank}/{bulletin.total_students}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isPublished && (
            <Badge variant="secondary" className="text-[10px]">Brouillon</Badge>
          )}
          {isPublished && (
            <>
              <PdfPreviewButton
                fetchBlob={() => studentPortalApi.downloadBulletin(bulletin.id)}
                label={`le bulletin ${bulletin.trimester}`}
                size="sm"
                className="h-11 sm:h-9"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
                aria-label={`Télécharger le bulletin ${bulletin.trimester} en PDF`}
                className="h-11 sm:h-9"
              >
                {isDownloading ? (
                  <Loader2 aria-hidden="true" className="mr-1 h-4 w-4 animate-spin sm:h-3 sm:w-3" />
                ) : (
                  <Download aria-hidden="true" className="mr-1 h-4 w-4 sm:h-3 sm:w-3" />
                )}
                PDF
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function BulletinsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-lg" />
      ))}
    </div>
  )
}
