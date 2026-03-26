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

// Données de démo — sera remplacé par l'API /dashboard/charts
const enrollmentData = [
  { level: "6ème", count: 87 },
  { level: "5ème", count: 72 },
  { level: "4ème", count: 65 },
  { level: "3ème", count: 58 },
  { level: "2nde", count: 45 },
  { level: "1ère", count: 38 },
  { level: "Tle", count: 32 },
]

const statusData = [
  { name: "Validées", value: 342, color: "hsl(var(--primary))" },
  { name: "En attente", value: 45, color: "hsl(var(--accent))" },
  { name: "Rejetées", value: 10, color: "hsl(var(--destructive))" },
]

export function DashboardCharts() {
  const hasData = enrollmentData.some((d) => d.count > 0)

  return (
    <div className="grid gap-4">
      {/* Bar chart — enrollment by level */}
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

      {/* Pie chart — enrollment status */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Statut des inscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry) => (
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
