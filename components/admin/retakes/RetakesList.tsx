"use client"

import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatPeriod, formatSchoolDate } from "@/components/shared/school-life/school-life-ui"
import type { RetakeAuthorization } from "@/lib/contracts/school-life"

interface RetakesListProps {
  items: RetakeAuthorization[]
  onDownload: (authorization: RetakeAuthorization) => void
  downloadingId: number | null
}

/**
 * Billets délivrés, du plus récent au plus ancien. Une carte par billet :
 * les évaluations rouvertes comptent autant que l'entête, elles ne tiennent
 * pas dans une cellule de tableau.
 */
export function RetakesList({ items, onDownload, downloadingId }: RetakesListProps) {
  return (
    <div className="space-y-3">
      {items.map((authorization) => (
        <Card key={authorization.id} className="rounded-xl border shadow-sm">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{authorization.student_name}</p>
                  <Badge variant="secondary">
                    {authorization.class_name ?? "Classe non renseignée"}
                  </Badge>
                  <Badge variant="outline">Trimestre {authorization.trimester}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Absence du {formatPeriod(authorization.period_start, authorization.period_end)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Motif : {authorization.reason}
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="h-11 shrink-0 gap-1.5 sm:h-9"
                onClick={() => onDownload(authorization)}
                disabled={downloadingId === authorization.id}
                aria-label={`Télécharger le billet de ${authorization.student_name}`}
              >
                {downloadingId === authorization.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
                PDF
              </Button>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Évaluations rouvertes
              </p>
              <ul className="mt-2 space-y-1.5">
                {authorization.evaluations.map((evaluation) => (
                  <li key={evaluation.evaluation_id} className="text-sm">
                    {evaluation.title}
                    <span className="block text-xs text-muted-foreground">
                      {evaluation.subject_name ?? "Matière non renseignée"} ·{" "}
                      {formatSchoolDate(evaluation.date)} · coefficient {evaluation.coefficient}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              Délivré par {authorization.issued_by_name ?? "un membre de l'administration"} le{" "}
              {formatSchoolDate(authorization.created_at)}
              {authorization.reference ? ` · réf. ${authorization.reference}` : ""}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
