"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { BulletinStatusBadge } from "./BulletinStatusBadge"
import { useBulletin } from "@/lib/hooks/useBulletins"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface BulletinPreviewModalProps {
  bulletinId: number | null
  onClose: () => void
}

function getMentionColor(mention: string | null): string {
  if (!mention) return "text-muted-foreground"
  switch (mention) {
    case "Très Bien":
      return "text-emerald-600 dark:text-emerald-400"
    case "Bien":
      return "text-primary"
    case "Assez Bien":
      return "text-accent"
    case "Passable":
      return "text-amber-600 dark:text-amber-400"
    default:
      return "text-muted-foreground"
  }
}

export function BulletinPreviewModal({ bulletinId, onClose }: BulletinPreviewModalProps) {
  const { data: bulletin, isLoading } = useBulletin(bulletinId ?? 0)

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
                  <TableHead className="text-center">Moyenne</TableHead>
                  <TableHead className="text-center">Moy. classe</TableHead>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Appréciation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulletin.subject_grades.map((sg) => (
                  <TableRow key={sg.subject_name}>
                    <TableCell className="font-medium">{sg.subject_name}</TableCell>
                    <TableCell className="text-center">{sg.coefficient}</TableCell>
                    <TableCell className="text-center font-semibold">
                      {sg.average !== null ? sg.average.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {sg.class_average !== null ? sg.class_average.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{sg.teacher_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sg.appreciation ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
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

            {/* Appréciation du conseil de classe */}
            {bulletin.class_council_appreciation && (
              <div className="rounded-lg border p-4 space-y-1">
                <p className="text-sm font-medium">Appréciation du conseil de classe</p>
                <p className="text-sm text-muted-foreground">
                  {bulletin.class_council_appreciation}
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
