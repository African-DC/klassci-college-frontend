"use client"

import { useState, useMemo } from "react"
import { Save, CheckCircle, XCircle, Clock, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AttendanceStatusBadge } from "./AttendanceStatusBadge"
import { useAttendanceSession, useSaveAttendance } from "@/lib/hooks/useAttendance"
import type { AttendanceStatus } from "@/lib/contracts/attendance"

interface AttendanceGridProps {
  classId: number
  slotId: number
  date: string
}

const STATUS_BUTTONS: { status: AttendanceStatus; icon: typeof CheckCircle; label: string; className: string }[] = [
  { status: "present", icon: CheckCircle, label: "P", className: "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" },
  { status: "absent", icon: XCircle, label: "A", className: "text-destructive hover:bg-destructive/10" },
  { status: "retard", icon: Clock, label: "R", className: "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30" },
  { status: "excuse", icon: ShieldCheck, label: "E", className: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30" },
]

export function AttendanceGrid({ classId, slotId, date }: AttendanceGridProps) {
  const { data: session, isLoading } = useAttendanceSession(classId, slotId, date)
  const { mutate: saveBatch, isPending: isSaving } = useSaveAttendance(classId, slotId, date)

  // État local des modifications
  const [localStatuses, setLocalStatuses] = useState<Map<number, AttendanceStatus>>(new Map())

  // Index O(1) pour les records serveur
  const recordsByStudent = useMemo(() => {
    if (!session) return new Map<number, AttendanceStatus>()
    const map = new Map<number, AttendanceStatus>()
    session.records.forEach((r) => { if (r.status) map.set(r.student_id, r.status) })
    return map
  }, [session])

  // Statut courant (local si modifié, sinon celui du serveur, sinon non pointé)
  function getStatus(studentId: number): AttendanceStatus | null {
    return localStatuses.get(studentId) ?? recordsByStudent.get(studentId) ?? null
  }

  function handleStatusChange(studentId: number, status: AttendanceStatus) {
    setLocalStatuses((prev) => {
      const next = new Map(prev)
      next.set(studentId, status)
      return next
    })
  }

  // Marquer tous les élèves avec un statut
  function handleMarkAll(status: AttendanceStatus) {
    if (!session) return
    setLocalStatuses(() => {
      const next = new Map<number, AttendanceStatus>()
      session.records.forEach((r) => next.set(r.student_id, status))
      return next
    })
  }

  function handleSave() {
    if (!session) return
    const records = session.records.map((r) => ({
      student_id: r.student_id,
      // Au moment de l'enregistrement, les élèves non pointés sont considérés présents
      status: getStatus(r.student_id) ?? "present",
    }))
    saveBatch(
      { records },
      { onSuccess: () => setLocalStatuses(new Map()) },
    )
  }

  // Compteurs en temps réel (logique inlinée pour éviter la closure sur getStatus)
  const counts = useMemo(() => {
    if (!session) return { present: 0, absent: 0, retard: 0, excuse: 0, non_pointe: 0 }
    const c = { present: 0, absent: 0, retard: 0, excuse: 0, non_pointe: 0 }
    session.records.forEach((r) => {
      const status = localStatuses.get(r.student_id) ?? r.status ?? null
      if (status) {
        c[status]++
      } else {
        c.non_pointe++
      }
    })
    return c
  }, [session, localStatuses])

  const hasChanges = localStatuses.size > 0

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    )
  }

  if (!session) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Aucune session trouvée pour ce créneau et cette date.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* En-tête de session */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="text-muted-foreground">
          <strong>{session.subject_name}</strong> — {session.class_name} — {session.teacher_name}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{counts.present} P</span>
          <span className="text-destructive font-medium">{counts.absent} A</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">{counts.retard} R</span>
          <span className="text-blue-600 dark:text-blue-400 font-medium">{counts.excuse} E</span>
          {counts.non_pointe > 0 && (
            <span className="text-muted-foreground font-medium">{counts.non_pointe} ?</span>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => handleMarkAll("present")}>
          <CheckCircle className="mr-1 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          Tous présents
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleMarkAll("absent")}>
          <XCircle className="mr-1 h-3 w-3 text-destructive" />
          Tous absents
        </Button>
      </div>

      {/* Grille de pointage */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Élève</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="text-center">Pointage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {session.records.map((record, index) => {
              const currentStatus = getStatus(record.student_id)
              return (
                <TableRow key={record.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{record.student_name}</TableCell>
                  <TableCell className="text-center">
                    <AttendanceStatusBadge status={currentStatus} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {STATUS_BUTTONS.map(({ status, icon: Icon, label, className }) => (
                        <Button
                          key={status}
                          size="icon"
                          variant={currentStatus === status ? "default" : "ghost"}
                          className={`h-8 w-8 ${currentStatus !== status ? className : ""}`}
                          onClick={() => handleStatusChange(record.student_id, status)}
                          aria-label={`${label} pour ${record.student_name}`}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Bouton enregistrer */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Enregistrement..." : "Enregistrer les présences"}
        </Button>
      </div>
    </div>
  )
}
