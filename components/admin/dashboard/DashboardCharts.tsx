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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  color: "hsl(var(--foreground))",
}

export function DashboardCharts() {
  const { data: yearsData } = useAcademicYears()
  const currentYear = yearsData?.items?.find((y) => y.is_current)

  const { data: stats, isLoading } = useDrenStats(currentYear?.id)

  // Données pour le bar chart (inscriptions par niveau)
  const enrollmentData = stats?.levels?.map((l) => ({
    level: l.level_name,
    count: l.total_students,
  })) ?? []

  // Données pour le donut garçons/filles
  const totalStudents = stats?.total_students ?? 0
  const maleCount = stats?.male_count ?? 0
  const femaleCount = stats?.female_count ?? 0

  const genderData = totalStudents > 0
    ? [
        { name: "Garçons", value: maleCount },
        { name: "Filles", value: femaleCount },
      ]
    : []

  // Données pour le donut répartition par niveau
  const levelDonutData = stats?.levels
    ?.filter((l) => l.total_students > 0)
    .map((l) => ({
      name: l.level_name,
      value: l.total_students,
    })) ?? []

  // Données pour le donut répartition par classe
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
      {/* Bar chart — Inscriptions par niveau */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Inscriptions par niveau
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="level" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Élèves" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Aucune donnée d'inscription pour le moment" />
          )}
        </CardContent>
      </Card>

      {/* Donut — Répartition par niveau */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Répartition par niveau
          </CardTitle>
        </CardHeader>
        <CardContent>
          {levelDonutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={levelDonutData}
                  cx="50%"
                  cy="50%"
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
                    <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                  )}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} élèves`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Aucune donnée disponible" />
          )}
        </CardContent>
      </Card>

      {/* Donut — Garçons / Filles */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Répartition garçons / filles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {genderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
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
                    <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                  )}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} élèves`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Aucune donnée disponible" />
          )}
        </CardContent>
      </Card>

      {/* Donut — Répartition par classe */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Répartition par classe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classDonutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={classDonutData}
                  cx="50%"
                  cy="50%"
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
                    <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                  )}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} élèves`, ""]} />
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
    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
