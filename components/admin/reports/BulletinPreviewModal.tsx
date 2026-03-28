"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { BulletinStatusBadge } from "./BulletinStatusBadge"
import { useBulletin } from "@/lib/hooks/useBulletins"
import { getMentionColor } from "@/lib/utils"
import type { BulletinDecision } from "@/lib/contracts/bulletin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const COUNCIL_DECISION_LABELS: Record<BulletinDecision, string> = {
  admis: "Admis(e)",
  redouble: "Redouble",
  exclu: "Exclu(e)",
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
            {/* En-tête école */}
            <div className="text-center space-y-1 border-b pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                République de Côte d&apos;Ivoire
              </p>
              <h2 className="font-serif text-lg font-semibold">
                Bulletin de notes — {bulletin.academic_year_label}
              </h2>
              <p className="text-sm text-muted-foreground">
                {bulletin.trimester === "1" && "Premier trimestre"}
                {bulletin.trimester === "2" && "Deuxième trimestre"}
                {bulletin.trimester === "3" && "Troisième trimestre"}
              </p>
            </div>

            {/* Infos élève */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p>
                  <span className="text-muted-foreground">Élève :</span>{" "}
                  <strong>{bulletin.student_name}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Classe :</span>{" "}
                  {bulletin.class_name}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p>
                  <span className="text-muted-foreground">Rang :</span>{" "}
                  <strong>
                    {bulletin.rank ?? "—"}/{bulletin.total_students}
                  </strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Statut :</span>{" "}
                  <BulletinStatusBadge status={bulletin.status} />
                </p>
              </div>
            </div>

            <Separator />

            {/* Tableau des notes */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matière</TableHead>
                  <TableHead className="text-center">Coeff.</TableHead>
                  <TableHead className="text-center">Note/20</TableHead>
                  <TableHead className="text-center">Coef × Note</TableHead>
                  <TableHead className="text-center">Moy. classe</TableHead>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Appréciation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulletin.subject_grades.map((sg) => {
                  // Calcul du total coef × note (fourni par l'API ou calculé)
                  const coefXNote = sg.coef_x_note
                    ?? (sg.average !== null ? sg.coefficient * sg.average : null)
                  return (
                    <TableRow key={sg.subject_name}>
                      <TableCell className="font-medium">{sg.subject_name}</TableCell>
                      <TableCell className="text-center">{sg.coefficient}</TableCell>
                      <TableCell className="text-center font-semibold">
                        {sg.average !== null ? sg.average.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {coefXNote !== null ? coefXNote.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {sg.class_average !== null ? sg.class_average.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{sg.teacher_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sg.appreciation ?? "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <Separator />

            {/* Résumé */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Moyenne générale</p>
                <p className="text-2xl font-bold">
                  {bulletin.average !== null ? bulletin.average.toFixed(2) : "—"}
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

            {/* Conseil de classe : décision + appréciation */}
            {(bulletin.council_decision || bulletin.class_council_appreciation) && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Conseil de classe</p>
                {bulletin.council_decision && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Décision :</span>{" "}
                    <strong>{COUNCIL_DECISION_LABELS[bulletin.council_decision] ?? bulletin.council_decision}</strong>
                  </p>
                )}
                {bulletin.class_council_appreciation && (
                  <p className="text-sm text-muted-foreground">
                    {bulletin.class_council_appreciation}
                  </p>
                )}
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
