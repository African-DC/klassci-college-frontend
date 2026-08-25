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
import { useInfiniteStudentAttendance } from "@/lib/hooks/useStudentPortal"
import { useScrollSentinel } from "@/lib/hooks/useScrollSentinel"
import { DataError } from "@/components/shared/DataError"

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  present: { label: "Présent", variant: "default", className: "bg-emerald-600 hover:bg-emerald-600/80" },
  absent: { label: "Absent", variant: "destructive" },
  late: { label: "En retard", variant: "secondary", className: "bg-amber-500 text-white hover:bg-amber-500/80" },
  excused: { label: "Excusé", variant: "outline" },
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, variant: "outline" as const }
}

export function StudentAttendanceClient() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const { data, isLoading, isError, refetch, scrollInfini } = useInfiniteStudentAttendance({
    status: statusFilter,
  })

  const sentinelle = useScrollSentinel({
    actif: scrollInfini.resteAcharger && !scrollInfini.chargeEnCours,
    onApproche: scrollInfini.chargerSuite,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardCheck aria-hidden="true" className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl tracking-tight">Présences</h1>
          <p className="text-sm text-muted-foreground">Historique de présence</p>
        </div>
      </div>

      {/* Filtre statut */}
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter ?? "all"}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? undefined : v)
          }}
        >
          <SelectTrigger
            aria-label="Filtrer par statut"
            className="h-11 w-full sm:h-10 sm:w-44"
          >
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="present">Présent</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="late">En retard</SelectItem>
            <SelectItem value="excused">Excusé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <AttendanceSkeleton />
      ) : isError ? (
        <DataError message="Impossible de charger les présences." onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 py-12 text-center text-sm text-muted-foreground">
          Aucun enregistrement de présence pour le moment.
        </div>
      ) : (
        <>
          {/* Desktop : table dense */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Heure d&apos;arrivée</TableHead>
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
                        {record.time_in ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {record.notes ?? "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile : cards date-prominent avec badge statut */}
          <div className="space-y-2 md:hidden">
            {data.items.map((record) => {
              const config = getStatusConfig(record.status)
              return (
                <div key={record.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize">
                        {new Date(record.created_at).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      {record.time_in && (
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          Arrivée à {record.time_in}
                        </p>
                      )}
                      {record.notes && (
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {record.notes}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={config.variant}
                      className={`shrink-0 text-[10px] ${config.className ?? ""}`}
                    >
                      {config.label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Charger la suite en approchant du bas : sur un téléphone,
              viser « Suivant » au pouce coûte plus que de descendre. */}
          <div ref={sentinelle} aria-hidden="true" className="h-px" />
          <p className="text-center text-xs text-muted-foreground tabular-nums" aria-live="polite">
              {scrollInfini.chargeEnCours
                ? "Chargement…"
                : scrollInfini.resteAcharger
                  ? `${data.items.length} sur ${data.total}`
                  : `${data.total} enregistrement${data.total > 1 ? "s" : ""}`}
          </p>
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
