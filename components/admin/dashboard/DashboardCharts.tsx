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
        { name: "Garçons", value: maleCount, color: "hsl(var(--primary))" },
        { name: "Filles", value: femaleCount, color: "hsl(var(--accent))" },
      ]
    : []

  const hasData = enrollmentData.some((d) => d.count > 0)

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-[280px] w-full" /></CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-[280px] w-full" /></CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              Aucune donnée d&apos;inscription pour le moment
            </div>
          )}
        </CardContent>
      </Card>

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
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {genderData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  formatter={(value) => (
                    <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
