"use client"

import { useEffect, useState } from "react"
import { Loader2, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { StudentPicker } from "@/components/shared/StudentPicker"
import { useStudentParents } from "@/lib/hooks/useParents"
import { useCreateSummons } from "@/lib/hooks/useSummons"
import { ParentSummonsCreateSchema } from "@/lib/contracts/school-life"
import type { Student } from "@/lib/contracts/student"

const OTHER_PARENT = "other"

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

/**
 * Émission d'une convocation. Le tuteur se choisit dans les fiches liées à
 * l'élève ; « Autre personne » ouvre un champ libre pour le nom dicté au
 * guichet, parce qu'un tuteur n'a pas toujours de fiche.
 */
export function SummonsCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [student, setStudent] = useState<Student | null>(null)
  const [parentChoice, setParentChoice] = useState(OTHER_PARENT)
  const [parentName, setParentName] = useState("")
  const [summonsDate, setSummonsDate] = useState(today)
  const [summonsTime, setSummonsTime] = useState("08:00")
  const [trimester, setTrimester] = useState("auto")
  const [reason, setReason] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: parents, isLoading: loadingParents } = useStudentParents(student?.id)
  const { mutate: create, isPending } = useCreateSummons()

  useEffect(() => {
    if (open) {
      setStudent(null)
      setParentChoice(OTHER_PARENT)
      setParentName("")
      setSummonsDate(today())
      setSummonsTime("08:00")
      setTrimester("auto")
      setReason("")
      setErrors({})
    }
  }, [open])

  // Le tuteur par défaut est le premier lié : au guichet, c'est presque
  // toujours celui-là qu'on convoque.
  useEffect(() => {
    if (parents && parents.length > 0) setParentChoice(String(parents[0].id))
    else setParentChoice(OTHER_PARENT)
  }, [parents])

  function handleSubmit() {
    const payload = {
      student_id: student?.id ?? 0,
      parent_id: parentChoice === OTHER_PARENT ? null : Number(parentChoice),
      parent_name: parentChoice === OTHER_PARENT ? parentName : undefined,
      summons_date: summonsDate,
      summons_time: summonsTime,
      reason,
      trimester: trimester === "auto" ? null : Number(trimester),
    }

    const parsed = ParentSummonsCreateSchema.safeParse(payload)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === "string" && !next[key]) next[key] = issue.message
      }
      setErrors(next)
      return
    }
    setErrors({})
    create(parsed.data, { onSuccess: () => onClose() })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" aria-hidden="true" />
            Nouvelle convocation
          </DialogTitle>
          <DialogDescription>
            Le tuteur est convoqué à une date et une heure précises. La convocation
            s&apos;inscrit au registre, et son PDF se télécharge ensuite.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto py-2 pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="summons-student">Élève</Label>
            <StudentPicker
              inputId="summons-student"
              selected={student}
              onSelect={setStudent}
              onClear={() => setStudent(null)}
            />
            {errors.student_id && <p className="text-sm text-destructive">{errors.student_id}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="summons-parent">Tuteur convoqué</Label>
            <Select value={parentChoice} onValueChange={setParentChoice} disabled={!student}>
              <SelectTrigger id="summons-parent" className="h-11 sm:h-10">
                <SelectValue placeholder={loadingParents ? "Chargement…" : "Choisir le tuteur"} />
              </SelectTrigger>
              <SelectContent>
                {(parents ?? []).map((parent) => (
                  <SelectItem key={parent.id} value={String(parent.id)}>
                    {parent.last_name} {parent.first_name}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_PARENT}>Autre personne (saisir le nom)</SelectItem>
              </SelectContent>
            </Select>
            {student && !loadingParents && (parents ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">
                Aucun parent lié à {student.first_name} : saisissez le nom du tuteur ci-dessous.
              </p>
            )}
          </div>

          {parentChoice === OTHER_PARENT && (
            <div className="space-y-1.5">
              <Label htmlFor="summons-parent-name">Nom du tuteur</Label>
              <Input
                id="summons-parent-name"
                value={parentName}
                onChange={(event) => setParentName(event.target.value)}
                placeholder="M. Konan Kouassi"
                maxLength={200}
                className="h-11 sm:h-10"
              />
              {errors.parent_name && (
                <p className="text-sm text-destructive">{errors.parent_name}</p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="summons-date">Date</Label>
              <Input
                id="summons-date"
                type="date"
                value={summonsDate}
                min={today()}
                onChange={(event) => setSummonsDate(event.target.value)}
                className="h-11 sm:h-10"
              />
              {errors.summons_date && (
                <p className="text-sm text-destructive">{errors.summons_date}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="summons-time">Heure</Label>
              <Input
                id="summons-time"
                type="time"
                value={summonsTime}
                onChange={(event) => setSummonsTime(event.target.value)}
                className="h-11 sm:h-10"
              />
              {errors.summons_time && (
                <p className="text-sm text-destructive">{errors.summons_time}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="summons-trimester">Trimestre</Label>
            <Select value={trimester} onValueChange={setTrimester}>
              <SelectTrigger id="summons-trimester" className="h-11 sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Déduit de la date</SelectItem>
                <SelectItem value="1">Trimestre 1</SelectItem>
                <SelectItem value="2">Trimestre 2</SelectItem>
                <SelectItem value="3">Trimestre 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="summons-reason">Motif</Label>
            <Textarea
              id="summons-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Absences répétées en mathématiques, comportement en classe…"
              maxLength={2000}
              className="min-h-24"
            />
            <p className="text-xs text-muted-foreground">
              Le motif figure sur la convocation remise au tuteur.
            </p>
            {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="h-11 sm:h-10"
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} className="h-11 gap-2 sm:h-10">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Megaphone className="h-4 w-4" aria-hidden="true" />
            )}
            {isPending ? "Enregistrement…" : "Convoquer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
