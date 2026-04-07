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
      class_count: acc.class_count + level.classes.length,
    }),
    { total_students: 0, male_count: 0, female_count: 0, class_count: 0 },
  )

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Detail par niveau</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Niveau</TableHead>
              <TableHead className="text-center">Effectif</TableHead>
              <TableHead className="text-center">Garcons</TableHead>
              <TableHead className="text-center">Filles</TableHead>
              <TableHead className="text-center">Classes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((level) => (
              <TableRow key={level.level_id}>
                <TableCell className="font-medium">{level.level_name}</TableCell>
                <TableCell className="text-center">{level.total_students}</TableCell>
                <TableCell className="text-center">{level.male_count}</TableCell>
                <TableCell className="text-center">{level.female_count}</TableCell>
                <TableCell className="text-center">{level.classes.length}</TableCell>
              </TableRow>
            ))}
            {/* Ligne total */}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-center">{totals.total_students}</TableCell>
              <TableCell className="text-center">{totals.male_count}</TableCell>
              <TableCell className="text-center">{totals.female_count}</TableCell>
              <TableCell className="text-center">{totals.class_count}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
