"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Check, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useTeacherAttendanceList,
  useValidateTeacherAttendance,
} from "@/lib/hooks/useTeacherAttendance"
import type { TeacherAttendanceResponse } from "@/lib/contracts/teacher-attendance"
import { AttendanceStatusChip } from "./AttendanceStatusChip"
import {
  cleanNotes,
  formatLongFrenchDate,
} from "./teacher-attendance-helpers"

interface PendingValidationSectionProps {
  teacherId: number
  academicYearId?: number
}

export function PendingValidationSection({
  teacherId,
  academicYearId,
}: PendingValidationSectionProps) {
  // BE filter is_validated=false n'est pas exposé directement, donc on récupère
  // tout et filtre côté FE (volume modéré : < 50 items typiques).
  const { data, isLoading } = useTeacherAttendanceList(
    teacherId,
    {
      academic_year_id: academicYearId,
      per_page: 200,
    },
    { enabled: teacherId > 0 },
  )

  const pending = (data?.items ?? []).filter((item) => !item.is_validated)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Chargement des auto-déclarations...
        </CardContent>
      </Card>
    )
  }

  if (pending.length === 0) return null

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          Auto-déclarations en attente
          <span className="ml-1 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
            {pending.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {pending.map((item) => (
          <PendingRow key={item.id} item={item} />
        ))}
      </CardContent>
    </Card>
  )
}

function PendingRow({ item }: { item: TeacherAttendanceResponse }) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const { mutate: validate, isPending } = useValidateTeacherAttendance()

  function submit(approved: boolean, close: () => void) {
    validate(
      {
        attendanceId: item.id,
        data: { approved, admin_notes: cleanNotes(adminNotes) },
      },
      {
        onSuccess: () => {
          setAdminNotes("")
          close()
        },
      },
    )
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-white p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <AttendanceStatusChip
              status={item.status}
              lateMinutes={item.late_minutes}
            />
            <span className="text-sm font-medium">
              {formatLongFrenchDate(item.date)}
            </span>
          </div>
          {item.slot_summary && (
            <p className="text-xs text-muted-foreground">{item.slot_summary}</p>
          )}
          {item.notes && (
            <p className="text-xs italic text-muted-foreground">
              « {item.notes} »
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            Déclaré par {item.declared_by_email ?? "l'enseignant"}
          </p>
        </div>
        <div className="flex gap-2 sm:flex-col">
          <Button
            size="sm"
            className="h-11 flex-1 bg-emerald-600 font-medium text-white hover:bg-emerald-700 sm:h-9 sm:flex-none"
            disabled={isPending}
            onClick={() => setApproveOpen(true)}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Valider
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-11 flex-1 border-rose-200 font-medium text-rose-700 hover:bg-rose-50 sm:h-9 sm:flex-none"
            disabled={isPending}
            onClick={() => setRejectOpen(true)}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Rejeter
          </Button>
        </div>
      </div>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Valider cette déclaration ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            La déclaration sera marquée comme validée et comptabilisée dans
            les statistiques de présence.
          </p>
          <Textarea
            rows={3}
            placeholder="Notes administratives (optionnel)"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => submit(true, () => setApproveOpen(false))}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? "Validation..." : "Valider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter cette déclaration ?</AlertDialogTitle>
            <AlertDialogDescription>
              La déclaration sera conservée pour audit mais non comptabilisée.
              Précisez la raison du rejet pour informer l&apos;enseignant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            rows={3}
            placeholder="Raison du rejet (recommandé)"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => submit(false, () => setRejectOpen(false))}
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isPending ? "Rejet..." : "Rejeter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
