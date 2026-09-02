"use client"

import { useState } from "react"
import { CalendarClock, Check, X, Clock, CalendarCheck2, CalendarX2 } from "lucide-react"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLeaveRequests, useReviewLeaveRequest, useSetInterim } from "@/lib/hooks/useLeave"
import { useTeachers } from "@/lib/hooks/useTeachers"
import { leaveTypeLabel } from "@/lib/contracts/leave"
import { staffRoleLabel } from "@/lib/contracts/staff"
import { LeaveStatusBadge, formatDateRange, dayCount } from "@/components/shared/leave/leave-ui"
import { cn } from "@/lib/utils"
import { DirectoryFiltersBar } from "@/components/shared/list/DirectoryFiltersBar"
import { matchesSearch } from "@/lib/utils/list-search"

// Rôles qui ne sont pas assignables depuis la fiche Personnel. Tous les autres
// (secrétariat, caissier, éducateur, comptable, directeur des études, directeur)
// sont libellés par staffRoleLabel : une seule source de vérité, sinon un
// nouveau rôle s'affiche ici sous son slug technique.
const NON_STAFF_ROLE_LABELS: Record<string, string> = {
  teacher: "Enseignant",
  admin: "Administrateur",
}

function requesterRoleLabel(role?: string | null): string {
  if (!role) return "—"
  return NON_STAFF_ROLE_LABELS[role] ?? staffRoleLabel(role)
}

const FILTERS = [
  { key: "pending", label: "En attente" },
  { key: "", label: "Toutes" },
  { key: "approved", label: "Approuvées" },
  { key: "rejected", label: "Refusées" },
]

export function LeaveManagementClient() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("pending")
  const { data, isLoading } = useLeaveRequests()
  const { mutate: review, isPending: reviewing } = useReviewLeaveRequest()
  const { mutate: setInterim } = useSetInterim()
  const { data: teacherData } = useTeachers({ size: 100 })
  const teachers = teacherData?.items ?? []
  const [rejectTarget, setRejectTarget] = useState<number | null>(null)
  const [comment, setComment] = useState("")

  const requests = data ?? []
  const count = (s: string) => requests.filter((r) => r.status === s).length
  const filtered = (filter ? requests.filter((r) => r.status === filter) : requests).filter((r) =>
    matchesSearch([r.requester_name, r.reason, leaveTypeLabel(r.leave_type)], search),
  )

  const kpis: HeroKpi[] = [
    { label: "En attente", value: count("pending"), icon: Clock },
    { label: "Approuvées", value: count("approved"), icon: CalendarCheck2 },
    { label: "Refusées", value: count("rejected"), icon: CalendarX2 },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        icon={CalendarClock}
        title="Congés"
        subtitle="Demandes de congé des enseignants et du personnel"
        kpis={kpis}
      />

      <DirectoryFiltersBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher un demandeur..."
      />

      <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {FILTERS.map((f) => {
          const n = f.key ? count(f.key) : requests.length
          const active = filter === f.key
          return (
            <button
              key={f.key || "all"}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label} ({n})
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Aucune demande dans cette catégorie.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="rounded-xl border shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{r.requester_name ?? "—"}</p>
                      <span className="text-xs text-muted-foreground">
                        {requesterRoleLabel(r.requester_role)}
                      </span>
                      <LeaveStatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-sm">
                      {leaveTypeLabel(r.leave_type)} · {formatDateRange(r.start_date, r.end_date)} ·{" "}
                      {dayCount(r.start_date, r.end_date)} j
                    </p>
                    {r.reason && (
                      <p className="mt-0.5 text-xs text-muted-foreground">Motif : {r.reason}</p>
                    )}
                    {r.review_comment && (
                      <p className="mt-0.5 text-xs text-muted-foreground">Décision : {r.review_comment}</p>
                    )}
                  </div>

                  {r.status === "pending" && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        className="h-11 gap-1.5 bg-emerald-600 hover:bg-emerald-600/90 sm:h-10"
                        onClick={() => review({ id: r.id, approve: true })}
                        disabled={reviewing}
                      >
                        <Check className="h-4 w-4" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-11 gap-1.5 text-destructive hover:bg-destructive/10 sm:h-10"
                        onClick={() => {
                          setRejectTarget(r.id)
                          setComment("")
                        }}
                        disabled={reviewing}
                      >
                        <X className="h-4 w-4" />
                        Refuser
                      </Button>
                    </div>
                  )}
                </div>

                {r.status === "approved" && (
                  <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                    <span className="text-xs font-medium text-muted-foreground">Remplaçant :</span>
                    <Select
                      value={r.interim_teacher_id ? String(r.interim_teacher_id) : "none"}
                      onValueChange={(v) =>
                        setInterim({ id: r.id, teacherId: v === "none" ? null : Number(v) })
                      }
                    >
                      <SelectTrigger className="h-9 w-56">
                        <SelectValue placeholder="Aucun remplaçant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun remplaçant</SelectItem>
                        {teachers.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.last_name} {t.first_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={rejectTarget !== null} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
          </DialogHeader>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Motif du refus (optionnel, communiqué au demandeur)"
            className="min-h-24"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Annuler
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (rejectTarget !== null) review({ id: rejectTarget, approve: false, comment })
                setRejectTarget(null)
              }}
              disabled={reviewing}
            >
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
