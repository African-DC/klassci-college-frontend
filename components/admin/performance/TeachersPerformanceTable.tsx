import Link from "next/link"
import { Users } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { PerformanceAxis, TeacherPerformanceItem } from "@/lib/contracts/performance"
import { formatScore, ratingConfig, scoreColorClass } from "@/lib/utils/performance"
import { RatingPill } from "@/components/shared/performance/PerformanceParts"

const AXIS_KEYS = ["assiduite", "notes", "appel"] as const
const AXIS_SHORT: Record<string, string> = {
  assiduite: "Assiduité",
  notes: "Notes",
  appel: "Appel",
}

function axisOf(teacher: TeacherPerformanceItem, key: string): PerformanceAxis | undefined {
  return teacher.axes.find((a) => a.key === key)
}

function AxisScore({ axis }: { axis: PerformanceAxis | undefined }) {
  if (!axis || !axis.sufficient || axis.score === null) {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <span className={cn("font-semibold tabular-nums", scoreColorClass(axis.score))}>
      {formatScore(axis.score)}
    </span>
  )
}

function GlobalScore({ teacher }: { teacher: TeacherPerformanceItem }) {
  const cfg = ratingConfig(teacher.rating)
  return (
    <span
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-base font-bold tabular-nums"
      style={{ color: cfg.ringColor, backgroundColor: `${cfg.ringColor}1a` }}
    >
      {formatScore(teacher.global_score)}
    </span>
  )
}

export function TeachersPerformanceTable({ teachers }: { teachers: TeacherPerformanceItem[] }) {
  if (teachers.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-10 text-center">
        <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Aucun enseignant enregistré.</p>
        <Link href="/admin/teachers" className="mt-1 inline-block text-sm font-medium text-accent">
          Ajouter un enseignant
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Enseignant</TableHead>
              <TableHead className="text-center">Score global</TableHead>
              <TableHead className="text-center">Assiduité</TableHead>
              <TableHead className="text-center">Notes</TableHead>
              <TableHead className="text-center">Appel</TableHead>
              <TableHead className="text-right">Appréciation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((t) => (
              <TableRow key={t.teacher_id}>
                <TableCell>
                  <p className="font-medium">
                    {t.last_name} {t.first_name}
                  </p>
                  {t.speciality && (
                    <p className="text-xs text-muted-foreground">{t.speciality}</p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <GlobalScore teacher={t} />
                </TableCell>
                {AXIS_KEYS.map((key) => (
                  <TableCell key={key} className="text-center">
                    <AxisScore axis={axisOf(t, key)} />
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <RatingPill rating={t.rating} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-2 md:hidden">
        {teachers.map((t) => (
          <div key={t.teacher_id} className="rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {t.last_name} {t.first_name}
                </p>
                {t.speciality && (
                  <p className="truncate text-xs text-muted-foreground">{t.speciality}</p>
                )}
              </div>
              <GlobalScore teacher={t} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                {AXIS_KEYS.map((key) => (
                  <span key={key}>
                    {AXIS_SHORT[key]} <AxisScore axis={axisOf(t, key)} />
                  </span>
                ))}
              </div>
              <RatingPill rating={t.rating} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
