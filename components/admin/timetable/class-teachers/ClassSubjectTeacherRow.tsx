"use client"

import Link from "next/link"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ClassSubjectTeacherItem } from "@/lib/contracts/class-subject-teachers"

const NONE = "none"

interface ClassSubjectTeacherRowProps {
  item: ClassSubjectTeacherItem
  value: number | null
  disabled?: boolean
  onChange: (teacherId: number | null) => void
}

function SingleTeacherHint({ count }: { count: number }) {
  if (count !== 1) return null
  return (
    <p className="text-xs text-muted-foreground">Seul enseignant retenu pour ce niveau</p>
  )
}

function NoTeacherHint({ count }: { count: number }) {
  if (count !== 0) return null
  return (
    <p className="rounded-md bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      Aucun enseignant retenu pour cette matière. Ajoutez-en depuis{" "}
      <Link href="/admin/subjects" className="font-medium underline underline-offset-2">
        Matières
      </Link>
      .
    </p>
  )
}

function StatusBadge({ complete }: { complete: boolean }) {
  if (complete) {
    return (
      <Badge className="gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        Prêt
      </Badge>
    )
  }
  return (
    <Badge className="gap-1 bg-amber-50 text-amber-800 hover:bg-amber-50 dark:bg-amber-950/40 dark:text-amber-200">
      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
      À compléter
    </Badge>
  )
}

export function ClassSubjectTeacherRow({ item, value, disabled, onChange }: ClassSubjectTeacherRowProps) {
  const eligibleCount = item.eligible_teachers.length
  const complete = value !== null
  const selectDisabled = disabled || eligibleCount === 0

  return (
    <article
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm",
        "lg:grid lg:grid-cols-[minmax(0,1fr)_6rem_minmax(0,16rem)_7.5rem] lg:items-center lg:gap-4 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:bg-transparent lg:px-3 lg:py-3 lg:shadow-none",
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{item.subject_name}</p>
          {item.series_name && (
            <Badge variant="secondary" className="text-[10px]">
              {item.series_name}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground lg:hidden">{item.hours_per_week} h / semaine</p>
      </div>

      <p className="hidden text-sm text-muted-foreground lg:block">
        {item.hours_per_week} h / sem.
      </p>

      <div className="mt-3 min-w-0 space-y-1.5 lg:mt-0">
        <Select
          value={value !== null ? value.toString() : ""}
          onValueChange={(v) => onChange(v === NONE ? null : Number(v))}
          disabled={selectDisabled}
        >
          <SelectTrigger
            aria-label={`Enseignant de ${item.subject_name}`}
            className="h-11 w-full min-w-0"
          >
            <SelectValue placeholder="Choisir un enseignant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Aucun enseignant</SelectItem>
            {item.eligible_teachers.map((t) => (
              <SelectItem key={t.id} value={t.id.toString()}>
                {t.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SingleTeacherHint count={eligibleCount} />
        <NoTeacherHint count={eligibleCount} />
      </div>

      <div className="mt-3 lg:mt-0 lg:justify-self-end">
        <StatusBadge complete={complete} />
      </div>
    </article>
  )
}
