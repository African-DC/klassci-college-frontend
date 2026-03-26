"use client"

import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AttendanceStatusBadge } from "./AttendanceStatusBadge"
import { useAttendanceHistory } from "@/lib/hooks/useAttendance"
import type { AttendanceStatus, AttendanceHistoryParams } from "@/lib/contracts/attendance"

interface AttendanceHistoryProps {
  classId?: number
}

export function AttendanceHistory({ classId }: AttendanceHistoryProps) {
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | undefined>(undefined)

  const params: AttendanceHistoryParams = {
    ...(classId && { class_id: classId }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
    ...(statusFilter && { status: statusFilter }),
  }

  const { data, isLoading } = useAttendanceHistory(params)
  const records = data?.data ?? []

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Date début</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Date fin</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        <Select
          value={statusFilter ?? "all"}
          onValueChange={(v) => setStatusFilter(v === "all" ? undefined : (v as AttendanceStatus))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="present">Présent</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="retard">Retard</SelectItem>
            <SelectItem value="excuse">Excusé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Aucun enregistrement trouvé pour les filtres sélectionnés.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-sm text-muted-foreground">Noté à</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.student_name}</TableCell>
                  <TableCell>{new Date(record.date).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>
                    <AttendanceStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {record.noted_at
                      ? new Date(record.noted_at).toLocaleString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && (
        <div className="text-xs text-muted-foreground text-right">
          {data.total} enregistrement(s) — Page {data.page}/{data.total_pages}
        </div>
      )}
    </div>
  )
}
