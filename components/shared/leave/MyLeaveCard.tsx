"use client"

import { useState } from "react"
import { CalendarClock, Plus, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionTitle } from "@/components/shared/PageHero"
import { LeaveRequestModal } from "./LeaveRequestModal"
import { LeaveStatusBadge, formatDateRange, dayCount } from "./leave-ui"
import { useMyLeaveRequests, useCancelLeaveRequest } from "@/lib/hooks/useLeave"
import { leaveTypeLabel } from "@/lib/contracts/leave"

export function MyLeaveCard() {
  const [open, setOpen] = useState(false)
  const { data: requests, isLoading } = useMyLeaveRequests()
  const { mutate: cancel, isPending: cancelling } = useCancelLeaveRequest()

  return (
    <Card className="rounded-xl border shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle icon={CalendarClock}>Mes congés</SectionTitle>
          <Button size="sm" className="h-9 shrink-0" onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Demander
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        ) : !requests || requests.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucune demande de congé pour le moment. Cliquez sur « Demander » pour en créer une.
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{leaveTypeLabel(r.leave_type)}</p>
                    <LeaveStatusBadge status={r.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateRange(r.start_date, r.end_date)} · {dayCount(r.start_date, r.end_date)} j
                  </p>
                  {r.review_comment && (
                    <p className="mt-0.5 text-xs text-muted-foreground">Note : {r.review_comment}</p>
                  )}
                  {r.interim_teacher_name && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Remplacé par : {r.interim_teacher_name}
                    </p>
                  )}
                </div>
                {r.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10"
                    onClick={() => cancel(r.id)}
                    disabled={cancelling}
                    aria-label="Annuler la demande"
                    title="Annuler"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <LeaveRequestModal open={open} onClose={() => setOpen(false)} />
    </Card>
  )
}
