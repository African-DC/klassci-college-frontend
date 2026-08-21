"use client"

import { ClipboardCheck, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  SummonsOutcomeBadge,
  formatSchoolDate,
  formatSchoolTime,
} from "@/components/shared/school-life/school-life-ui"
import type { ParentSummons } from "@/lib/contracts/school-life"

interface SummonsRegisterListProps {
  items: ParentSummons[]
  onRecordOutcome: (summons: ParentSummons) => void
  onDownload: (summons: ParentSummons) => void
  downloadingId: number | null
}

function RowActions({
  summons,
  onRecordOutcome,
  onDownload,
  downloading,
}: {
  summons: ParentSummons
  onRecordOutcome: (summons: ParentSummons) => void
  onDownload: (summons: ParentSummons) => void
  downloading: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-11 gap-1.5 sm:h-9"
        onClick={() => onRecordOutcome(summons)}
        aria-label={`Consigner la suite donnée pour ${summons.student_name}`}
      >
        <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
        Suite donnée
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-11 gap-1.5 sm:h-9"
        onClick={() => onDownload(summons)}
        disabled={downloading}
        aria-label={`Télécharger la convocation de ${summons.student_name}`}
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        PDF
      </Button>
    </div>
  )
}

/**
 * Registre des convocations : tableau sur ordinateur, cartes sur téléphone.
 * L'éducateur consulte souvent depuis un mobile, dans le couloir.
 */
export function SummonsRegisterList({
  items,
  onRecordOutcome,
  onDownload,
  downloadingId,
}: SummonsRegisterListProps) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Élève</TableHead>
              <TableHead>Tuteur</TableHead>
              <TableHead>Rendez-vous</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead>Suite</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((summons) => (
              <TableRow key={summons.id}>
                <TableCell className="font-medium">
                  {summons.student_name}
                  <span className="block text-xs text-muted-foreground">
                    {summons.class_name ?? "Classe non renseignée"}
                  </span>
                </TableCell>
                <TableCell>{summons.parent_name ?? "Non nommé"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatSchoolDate(summons.summons_date)}
                  <span className="block text-xs text-muted-foreground">
                    {formatSchoolTime(summons.summons_time)} · T{summons.trimester}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs">
                  <span className="line-clamp-2 text-sm">{summons.reason}</span>
                </TableCell>
                <TableCell>
                  <SummonsOutcomeBadge
                    outcome={summons.outcome}
                    label={summons.outcome_label}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <RowActions
                      summons={summons}
                      onRecordOutcome={onRecordOutcome}
                      onDownload={onDownload}
                      downloading={downloadingId === summons.id}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {items.map((summons) => (
          <Card key={summons.id} className="rounded-xl border shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{summons.student_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {summons.class_name ?? "Classe non renseignée"} · T{summons.trimester}
                  </p>
                </div>
                <SummonsOutcomeBadge outcome={summons.outcome} label={summons.outcome_label} />
              </div>

              <p className="text-sm">
                Tuteur : {summons.parent_name ?? "non nommé"}
                <span className="block text-muted-foreground">
                  {formatSchoolDate(summons.summons_date)} à{" "}
                  {formatSchoolTime(summons.summons_time)}
                </span>
              </p>

              <p className="text-sm text-muted-foreground">{summons.reason}</p>

              {summons.outcome_notes && (
                <p className="rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">
                  Compte rendu : {summons.outcome_notes}
                </p>
              )}

              <RowActions
                summons={summons}
                onRecordOutcome={onRecordOutcome}
                onDownload={onDownload}
                downloading={downloadingId === summons.id}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
