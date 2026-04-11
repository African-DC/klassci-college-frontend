"use client"

import { useState } from "react"
import { ClipboardCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import { useStudentAttendance } from "@/lib/hooks/useStudentPortal"
import { DataError } from "@/components/shared/DataError"

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  present: { label: "Pr\u00e9sent", variant: "default", className: "bg-emerald-600 hover:bg-emerald-600/80" },
  absent: { label: "Absent", variant: "destructive" },
  late: { label: "En retard", variant: "secondary", className: "bg-amber-500 text-white hover:bg-amber-500/80" },
  excused: { label: "Excus\u00e9", variant: "outline" },
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, variant: "outline" as const }
}

export function StudentAttendanceClient() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useStudentAttendance({
    status: statusFilter,
    page,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl tracking-tight">Pr\u00e9sences</h1>
          <p className="text-sm text-muted-foreground">Historique de pr\u00e9sence</p>
        </div>
      </div>

      {/* Filtre statut */}
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter ?? "all"}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? undefined : v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="present">Pr\u00e9sent</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="late">En retard</SelectItem>
            <SelectItem value="excused">Excus\u00e9</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <AttendanceSkeleton />
      ) : isError ? (
        <DataError message="Impossible de charger l'historique de pr\u00e9sence." onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Aucun enregistrement de pr\u00e9sence.
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Heure d&apos;arriv\u00e9e</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((record) => {
                  const config = getStatusConfig(record.status)
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm">
                        {new Date(record.created_at).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className={`text-[10px] ${config.className ?? ""}`}>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.time_in
                          ? new Date(record.time_in).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {record.notes ?? "\u2014"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.total > data.size && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page {data.page} sur {Math.ceil(data.total / data.size)}
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Pr\u00e9c\u00e9dent
                </button>
                <button
                  className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
                  disabled={data.page >= Math.ceil(data.total / data.size)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AttendanceSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-44 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}
