"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GenderDistributionRow {
  level: string
  male: number
  female: number
}

interface EnrollmentByLevelChartProps {
  data: GenderDistributionRow[]
}

export function EnrollmentByLevelChart({ data }: EnrollmentByLevelChartProps) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Effectifs par niveau</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="level" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
              }}
            />
            <Legend />
            <Bar
              dataKey="male"
              name="Garcons"
              fill="hsl(216, 80%, 30%)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="female"
              name="Filles"
              fill="hsl(28, 91%, 54%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
