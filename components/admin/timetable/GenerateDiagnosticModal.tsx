"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, BookOpen, User } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTeachers } from "@/lib/hooks/useTeachers"
import { useUpdateSubject } from "@/lib/hooks/useSubjects"
import type { TimetableDiagnostic } from "@/lib/contracts/timetable"

interface GenerateDiagnosticModalProps {
  open: boolean
  diagnostic: TimetableDiagnostic | null
  onClose: () => void
  onGenerate: () => void
}

export function GenerateDiagnosticModal({
  open,
  diagnostic,
  onClose,
  onGenerate,
}: GenerateDiagnosticModalProps) {
  const [teacherAssignments, setTeacherAssignments] = useState<Record<number, number>>({})
  const [assigning, setAssigning] = useState(false)
  const { data: teachersData } = useTeachers({ size: 100 })
  const allTeachers = teachersData?.items ?? []
  const updateSubject = useUpdateSubject(0)

  if (!diagnostic) return null

  const missingCount = diagnostic.subjects_without_teacher.length
  const allAssigned = missingCount === 0

  function handleTeacherSelect(subjectId: number, teacherId: number) {
    setTeacherAssignments((prev) => ({ ...prev, [subjectId]: teacherId }))
  }

  const allMissingAssigned = diagnostic.subjects_without_teacher.every(
    (s) => teacherAssignments[s.id],
  )

  async function handleAssignAndGenerate() {
    if (!diagnostic) return
    setAssigning(true)
    try {
      // PATCH each subject with the selected teacher
      const { subjectsApi } = await import("@/lib/api/subjects")
      for (const subject of diagnostic.subjects_without_teacher) {
        const teacherId = teacherAssignments[subject.id]
        if (teacherId) {
          await subjectsApi.update(subject.id, { teacher_id: teacherId })
        }
      }
      toast.success("Enseignants assignes")
      onGenerate()
    } catch (err) {
      toast.error("Erreur lors de l'assignation", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      })
    } finally {
      setAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {allAssigned ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            Diagnostic de generation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-lg font-bold">{diagnostic.total_hours_required}h</p>
              <p className="text-[11px] text-muted-foreground">Heures requises</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-lg font-bold">{diagnostic.manual_slots_count}</p>
              <p className="text-[11px] text-muted-foreground">Manuels (preserves)</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-lg font-bold">{diagnostic.subjects_with_teacher.length + missingCount}</p>
              <p className="text-[11px] text-muted-foreground">Matieres</p>
            </div>
          </div>

          {/* Subjects with teacher */}
          {diagnostic.subjects_with_teacher.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Matieres pretes
              </p>
              <div className="space-y-1.5">
                {diagnostic.subjects_with_teacher.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-sm font-medium">{s.name}</span>
                      <Badge variant="secondary" className="text-[10px]">{s.hours_per_week}h/sem</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{s.teacher_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subjects WITHOUT teacher — inline assignment */}
          {missingCount > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
                Matieres sans enseignant ({missingCount})
              </p>
              <div className="space-y-2">
                {diagnostic.subjects_without_teacher.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="text-sm font-medium truncate">{s.name}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{s.hours_per_week}h</Badge>
                    </div>
                    <Select
                      value={teacherAssignments[s.id]?.toString() ?? ""}
                      onValueChange={(v) => handleTeacherSelect(s.id, Number(v))}
                    >
                      <SelectTrigger className="w-[180px] h-9 text-xs shrink-0">
                        <SelectValue placeholder="Choisir un enseignant" />
                      </SelectTrigger>
                      <SelectContent>
                        {allTeachers.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.first_name} {t.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          {allAssigned ? (
            <Button onClick={onGenerate}>
              Generer l'emploi du temps
            </Button>
          ) : (
            <Button
              onClick={handleAssignAndGenerate}
              disabled={!allMissingAssigned || assigning}
            >
              {assigning ? "Assignation..." : "Assigner et generer"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
