"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SuccessRateRow {
  level: string
  rate: number
}

interface SuccessRateChartProps {
  data: SuccessRateRow[]
}

// Couleur selon le taux de reussite
function getRateColor(rate: number): string {
  if (rate >= 80) return "hsl(142, 71%, 45%)" // emerald
  if (rate >= 60) return "hsl(216, 80%, 30%)" // primary
  if (rate >= 40) return "hsl(28, 91%, 54%)" // accent
  return "hsl(0, 84%, 60%)" // rose
}

export function SuccessRateChart({ data }: SuccessRateChartProps) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Taux de reussite par niveau</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="level" className="text-xs" />
            <YAxis domain={[0, 100]} unit="%" className="text-xs" />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, "Taux de reussite"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
              }}
            />
            <Bar dataKey="rate" name="Taux" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={getRateColor(entry.rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
