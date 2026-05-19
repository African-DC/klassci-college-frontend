"use client"

import { useState } from "react"
import { Trash2, MoreVertical, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useDeleteTeacherAttendance,
  useTeacherAttendanceList,
} from "@/lib/hooks/useTeacherAttendance"
import type {
  TeacherAttendanceResponse,
  TeacherAttendanceStatus,
} from "@/lib/contracts/teacher-attendance"
import { AttendanceStatusChip } from "./AttendanceStatusChip"
import {
  STATUS_LABEL,
  formatLongFrenchDate,
} from "./teacher-attendance-helpers"

interface AttendanceHistoryListProps {
  teacherId: number
  academicYearId?: number
}

type StatusFilter = TeacherAttendanceStatus | "all"

const STATUS_FILTER_OPTIONS: TeacherAttendanceStatus[] = [
  "absent_unexcused",
  "absent_excused",
  "late",
  "present",
]

export function AttendanceHistoryList({
  teacherId,
  academicYearId,
}: AttendanceHistoryListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const { data, isLoading } = useTeacherAttendanceList(teacherId, {
    academic_year_id: academicYearId,
    status: statusFilter === "all" ? undefined : statusFilter,
    per_page: 100,
  })

  return (
    <Card>
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-serif text-base">Historique</h3>
            {data && (
              <span className="text-xs text-muted-foreground">
                · {data.total} entrée{data.total > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {STATUS_LABEL[opt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            {statusFilter === "all"
              ? "Aucun pointage enregistré pour le moment."
              : "Aucun pointage avec ce statut."}
          </p>
        ) : (
          <ul className="space-y-2">
            {data.items.map((item) => (
              <AttendanceRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function AttendanceRow({ item }: { item: TeacherAttendanceResponse }) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { mutate: del, isPending } = useDeleteTeacherAttendance()

  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <AttendanceStatusChip
            status={item.status}
            lateMinutes={item.late_minutes}
          />
          <span className="text-sm font-medium">
            {formatLongFrenchDate(item.date)}
          </span>
          {!item.is_validated && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
              En attente
            </span>
          )}
        </div>
        {item.slot_summary && (
          <p className="text-xs text-muted-foreground">{item.slot_summary}</p>
        )}
        {item.notes && (
          <p className="text-xs italic text-muted-foreground">
            « {item.notes} »
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce pointage ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le pointage du {formatLongFrenchDate(item.date)} sera
              définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                del(item.id, { onSuccess: () => setDeleteOpen(false) })
              }
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}
