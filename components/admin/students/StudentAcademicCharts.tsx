"use client"

import { useMemo } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { LineChart as LineChartIcon, BarChart3, TrendingUp, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStudentFull } from "@/lib/hooks/useStudents"
import { TRIMESTER_FULL_LABEL, trimesterShortLabel, type TrimesterNumber } from "@/lib/utils/trimester"

interface TrimesterPoint {
  trimester: string
  general: number | null
  best: number | null
  worst: number | null
}

interface AbsencePoint {
  trimester: string
  justifiees: number
  non_justifiees: number
}

interface StudentAcademicChartsProps {
  studentId: number
}

export function StudentAcademicCharts({ studentId }: StudentAcademicChartsProps) {
  const { data: full } = useStudentFull(studentId)

  const hasEnrollment = full?.current_enrollment_id != null

  const trimesterData: TrimesterPoint[] = useMemo(() => {
    if (!full?.trimester_grades?.length) return []
    return full.trimester_grades.map((t) => ({
      trimester: trimesterShortLabel(t.trimester),
      general: t.general,
      best: t.best,
      worst: t.worst,
    }))
  }, [full?.trimester_grades])

  const absenceData: AbsencePoint[] = useMemo(() => {
    if (!full?.trimester_absences?.length) return []
    return full.trimester_absences.map((t) => ({
      trimester: trimesterShortLabel(t.trimester),
      justifiees: t.justifiees,
      non_justifiees: t.non_justifiees,
    }))
  }, [full?.trimester_absences])

  const hasGrades = trimesterData.some((p) => p.general !== null)
  const hasAbsences = absenceData.some((p) => p.justifiees + p.non_justifiees > 0)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Moyennes par trimestre */}
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 font-serif text-sm">
              <LineChartIcon className="h-4 w-4 text-primary" />
              Moyennes par trimestre
            </CardTitle>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
              Année courante
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Évolution sur les 3 trimestres
          </p>
        </CardHeader>
        <CardContent className="pb-4">
          {hasGrades ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trimesterData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                <defs>
                  <linearGradient id="gradGeneral" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F3F8C" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#0F3F8C" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="trimester" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 20]} ticks={[0, 5, 10, 15, 20]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<MoyenneTooltip />} />
                <Area
                  type="monotone"
                  dataKey="general"
                  name="Moyenne générale"
                  stroke="#0F3F8C"
                  strokeWidth={2.5}
                  fill="url(#gradGeneral)"
                  dot={{ fill: "#0F3F8C", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState
              icon={<TrendingUp className="h-6 w-6" />}
              title="Pas encore de notes"
              message={
                hasEnrollment
                  ? "Les moyennes apparaîtront ici dès la première évaluation saisie."
                  : "L'élève doit être inscrit pour voir ses moyennes."
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Absences par trimestre */}
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 font-serif text-sm">
              <BarChart3 className="h-4 w-4 text-accent" style={{ color: "#F58220" }} />
              Absences par trimestre
            </CardTitle>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide" style={{ color: "#F58220", backgroundColor: "rgba(245,130,32,0.12)" }}>
              Année courante
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Justifiées vs non justifiées
          </p>
        </CardHeader>
        <CardContent className="pb-4">
          {hasAbsences ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={absenceData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="trimester" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<AbsenceTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                <Bar dataKey="justifiees" name="Justifiées" stackId="abs" fill="#0F3F8C" radius={[0, 0, 0, 0]} />
                <Bar dataKey="non_justifiees" name="Non justifiées" stackId="abs" fill="#F58220" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState
              icon={<Trophy className="h-6 w-6 text-emerald-600" />}
              title="Aucune absence"
              message={
                hasEnrollment
                  ? "Bravo, présence parfaite sur cette année."
                  : "Les présences s'afficheront après inscription."
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ChartEmptyState({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode
  title: string
  message: string
}) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-xl bg-muted/20 px-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
        {icon}
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{message}</p>
    </div>
  )
}

function tooltipTitle(shortLabel: string | undefined): string {
  if (!shortLabel) return ""
  const n = Number(shortLabel.replace("T", "")) as TrimesterNumber
  return TRIMESTER_FULL_LABEL[n] ?? shortLabel
}

function MoyenneTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number | null; name: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{tooltipTitle(label)}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name} : <span className="font-mono font-medium text-foreground">{p.value !== null ? `${p.value}/20` : "—"}</span>
        </p>
      ))}
    </div>
  )
}

function AbsenceTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0)
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{tooltipTitle(label)}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name} : <span className="font-medium text-foreground">{p.value}</span>
        </p>
      ))}
      <p className="mt-1 border-t pt-1 font-medium">
        Total : <span className="font-mono">{total}</span>
      </p>
    </div>
  )
}
