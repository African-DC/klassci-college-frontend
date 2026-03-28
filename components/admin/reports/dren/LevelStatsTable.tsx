"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LevelStats } from "@/lib/contracts/dren"

interface LevelStatsTableProps {
  data: LevelStats[]
}

export function LevelStatsTable({ data }: LevelStatsTableProps) {
  // Totaux
  const totals = data.reduce(
    (acc, level) => ({
      total_students: acc.total_students + level.total_students,
      male_count: acc.male_count + level.male_count,
      female_count: acc.female_count + level.female_count,
      success_count: acc.success_count + level.success_count,
      fail_count: acc.fail_count + level.fail_count,
    }),
    { total_students: 0, male_count: 0, female_count: 0, success_count: 0, fail_count: 0 },
  )

  const totalRate =
    totals.total_students > 0
      ? ((totals.success_count / totals.total_students) * 100).toFixed(1)
      : "—"

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Détail par niveau</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Niveau</TableHead>
              <TableHead className="text-center">Effectif</TableHead>
              <TableHead className="text-center">Garçons</TableHead>
              <TableHead className="text-center">Filles</TableHead>
              <TableHead className="text-center">Admis</TableHead>
              <TableHead className="text-center">Recalés</TableHead>
              <TableHead className="text-center">Taux de réussite</TableHead>
              <TableHead className="text-center">Moyenne</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((level) => (
              <TableRow key={level.level}>
                <TableCell className="font-medium">{level.level}</TableCell>
                <TableCell className="text-center">{level.total_students}</TableCell>
                <TableCell className="text-center">{level.male_count}</TableCell>
                <TableCell className="text-center">{level.female_count}</TableCell>
                <TableCell className="text-center text-emerald-600">
                  {level.success_count}
                </TableCell>
                <TableCell className="text-center text-rose-600">
                  {level.fail_count}
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {level.success_rate.toFixed(1)}%
                </TableCell>
                <TableCell className="text-center">
                  {level.average !== null ? level.average.toFixed(2) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {/* Ligne total */}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-center">{totals.total_students}</TableCell>
              <TableCell className="text-center">{totals.male_count}</TableCell>
              <TableCell className="text-center">{totals.female_count}</TableCell>
              <TableCell className="text-center text-emerald-600">
                {totals.success_count}
              </TableCell>
              <TableCell className="text-center text-rose-600">
                {totals.fail_count}
              </TableCell>
              <TableCell className="text-center">{totalRate}%</TableCell>
              <TableCell className="text-center">—</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
