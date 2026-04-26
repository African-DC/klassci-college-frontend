"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { BulletinStatusBadge } from "./BulletinStatusBadge"
import { useBulletin } from "@/lib/hooks/useBulletins"
import { getMentionColor } from "@/lib/utils"
import type { BulletinDecision } from "@/lib/contracts/bulletin"

const COUNCIL_DECISION_LABELS: Record<BulletinDecision, string> = {
  passage: "Passage",
  repechage: "Repêchage",
  redoublement: "Redoublement",
  exclusion: "Exclusion",
}

interface BulletinPreviewModalProps {
  bulletinId: number | null
  onClose: () => void
}

export function BulletinPreviewModal({ bulletinId, onClose }: BulletinPreviewModalProps) {
  const { data: bulletin, isLoading } = useBulletin(bulletinId)

  return (
    <Dialog open={bulletinId !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulletin scolaire</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <BulletinPreviewSkeleton />
        ) : bulletin ? (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="text-center space-y-1 border-b pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                République de Côte d&apos;Ivoire
              </p>
              <h2 className="font-serif text-lg font-semibold">
                Bulletin de notes
              </h2>
              <p className="text-sm text-muted-foreground">
                {bulletin.trimester === 1 && "Premier trimestre"}
                {bulletin.trimester === 2 && "Deuxième trimestre"}
                {bulletin.trimester === 3 && "Troisième trimestre"}
              </p>
            </div>

            {/* Infos élève */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p>
                  <span className="text-muted-foreground">Élève ID :</span>{" "}
                  <strong>#{bulletin.student_id}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Classe ID :</span>{" "}
                  #{bulletin.class_id}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p>
                  <span className="text-muted-foreground">Rang :</span>{" "}
                  <strong>{bulletin.rank ?? "—"}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Statut :</span>{" "}
                  <BulletinStatusBadge isPublished={bulletin.is_published} />
                </p>
              </div>
            </div>

            <Separator />

            {/* Résumé */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Moyenne générale</p>
                <p className="text-2xl font-bold">
                  {bulletin.average !== null ? Number(bulletin.average).toFixed(2) : "—"}
                  <span className="text-sm font-normal text-muted-foreground">/20</span>
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground">Mention</p>
                <p className={`text-lg font-semibold ${getMentionColor(bulletin.mention)}`}>
                  {bulletin.mention ?? "Aucune"}
                </p>
              </div>
            </div>

            {/* Commentaire enseignant */}
            {bulletin.teacher_comment && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Commentaire de l&apos;enseignant</p>
                <p className="text-sm text-muted-foreground">{bulletin.teacher_comment}</p>
              </div>
            )}

            {/* Conseil de classe : décision */}
            {bulletin.council_decision && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Conseil de classe</p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Décision :</span>{" "}
                  <strong>{COUNCIL_DECISION_LABELS[bulletin.council_decision] ?? bulletin.council_decision}</strong>
                </p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function BulletinPreviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Skeleton className="mx-auto h-4 w-48" />
        <Skeleton className="mx-auto h-6 w-72" />
        <Skeleton className="mx-auto h-4 w-36" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  )
}
