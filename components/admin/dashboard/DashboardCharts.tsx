"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { useDrenStats } from "@/lib/hooks/useDrenStats"

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(215, 70%, 50%)",
  "hsl(150, 60%, 45%)",
  "hsl(280, 60%, 55%)",
  "hsl(340, 65%, 50%)",
  "hsl(45, 80%, 50%)",
  "hsl(180, 50%, 45%)",
]

// Custom premium tooltip
function PremiumTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-4 py-3 shadow-lg">
      {label && <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color || "hsl(var(--primary))" }} />
          <span className="text-xs text-muted-foreground">{entry.name} :</span>
          <span className="text-sm font-semibold">{entry.value.toLocaleString("fr-FR")} élèves</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="rounded-lg border bg-card px-4 py-3 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.payload.fill }} />
        <span className="text-sm font-semibold">{entry.name}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{entry.value.toLocaleString("fr-FR")} élèves</p>
    </div>
  )
}

export function DashboardCharts() {
  const { data: yearsData } = useAcademicYears()
  const currentYear = yearsData?.items?.find((y) => y.is_current)

  const { data: stats, isLoading } = useDrenStats(currentYear?.id)

  const enrollmentData = stats?.levels?.map((l) => ({
    level: l.level_name,
    count: l.total_students,
  })) ?? []

  const totalStudents = stats?.total_students ?? 0
  const maleCount = stats?.male_count ?? 0
  const femaleCount = stats?.female_count ?? 0

  const genderData = totalStudents > 0
    ? [
        { name: "Garçons", value: maleCount },
        { name: "Filles", value: femaleCount },
      ]
    : []

  const levelDonutData = stats?.levels
    ?.filter((l) => l.total_students > 0)
    .map((l) => ({
      name: l.level_name,
      value: l.total_students,
    })) ?? []

  const classDonutData = stats?.levels
    ?.flatMap((l) => l.classes)
    .filter((c) => c.total_students > 0)
    .map((c) => ({
      name: c.class_name,
      value: c.total_students,
    })) ?? []

  const hasData = enrollmentData.some((d) => d.count > 0)

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm ring-1 ring-border">
            <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-[280px] w-full" /></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Bar chart */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Inscriptions validées par niveau
          </CardTitle>
          <CardDescription className="text-xs">
            Uniquement les inscriptions au statut validé
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="level" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<PremiumTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
                <Bar dataKey="count" name="Élèves" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Aucune inscription validée pour le moment" />
          )}
        </CardContent>
      </Card>

      {/* Donut — Répartition par niveau */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Répartition par niveau
          </CardTitle>
          <CardDescription className="text-xs">
            Élèves avec inscription validée
          </CardDescription>
        </CardHeader>
        <CardContent>
          {levelDonutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={levelDonutData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {levelDonutData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  formatter={(value) => (
                    <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>{value}</span>
                  )}
                />
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Aucune donnée disponible" />
          )}
        </CardContent>
      </Card>

      {/* Donut — Garçons / Filles */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Répartition garçons / filles
          </CardTitle>
          <CardDescription className="text-xs">
            Élèves avec inscription validée
          </CardDescription>
        </CardHeader>
        <CardContent>
          {genderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--accent))" />
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  formatter={(value) => (
                    <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>{value}</span>
                  )}
                />
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Aucune donnée disponible" />
          )}
        </CardContent>
      </Card>

      {/* Donut — Répartition par classe */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Répartition par classe
          </CardTitle>
          <CardDescription className="text-xs">
            Élèves avec inscription validée
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classDonutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={classDonutData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {classDonutData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: "12px" }}
                  formatter={(value) => (
                    <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>{value}</span>
                  )}
                />
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Aucune donnée disponible" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
