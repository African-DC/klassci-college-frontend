"use client"

import { Award, GraduationCap, Trophy, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { BulletinStatusBadge } from "./BulletinStatusBadge"
import { getMentionBadgeClass, mentionFullLabel } from "./mention"
import { useBulletin } from "@/lib/hooks/useBulletins"
import { trimesterFullLabel } from "@/lib/utils/trimester"
import { cn, getUploadUrl } from "@/lib/utils"
import type { Bulletin, BulletinDecision } from "@/lib/contracts/bulletin"

const COUNCIL_DECISION_LABELS: Record<BulletinDecision, string> = {
  passage: "Passage",
  repechage: "Repêchage",
  redoublement: "Redoublement",
  exclusion: "Exclusion",
}

interface BulletinPreviewModalProps {
  bulletinId: number | null
  onClose: () => void
}

export function BulletinPreviewModal({ bulletinId, onClose }: BulletinPreviewModalProps) {
  const { data: bulletin, isLoading } = useBulletin(bulletinId)

  return (
    <Dialog open={bulletinId !== null} onOpenChange={onClose}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Bulletin scolaire</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <BulletinPreviewSkeleton />
        ) : bulletin ? (
          <BulletinPreviewBody bulletin={bulletin} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function BulletinPreviewBody({ bulletin }: { bulletin: Bulletin }) {
  const avg = bulletin.average !== null ? Number(bulletin.average).toFixed(2) : null
  const rankLabel =
    bulletin.rank !== null && bulletin.total_students > 0
      ? `${bulletin.rank} / ${bulletin.total_students}`
      : bulletin.rank !== null
        ? String(bulletin.rank)
        : "—"

  return (
    <div>
      <header className="border-b bg-gradient-to-br from-primary/5 via-transparent to-accent/5 px-6 pb-5 pt-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          République de Côte d&apos;Ivoire — Bulletin de notes
        </p>
        <h2 className="mt-1 font-serif text-xl text-foreground">
          {trimesterFullLabel(bulletin.trimester)}
        </h2>

        <div className="mt-4 flex items-start gap-4">
          <StudentAvatar
            name={bulletin.student_name}
            photoUrl={bulletin.student_photo_url}
          />
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg font-semibold tracking-tight text-foreground">
              {bulletin.student_name || "—"}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {bulletin.class_name}
              </span>
              {bulletin.student_enrollment_number && (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {bulletin.student_enrollment_number}
                </span>
              )}
            </div>
          </div>
          <BulletinStatusBadge isPublished={bulletin.is_published} />
        </div>
      </header>

      <section className="grid grid-cols-3 divide-x border-b">
        <KpiBlock
          icon={<Award className="h-4 w-4" />}
          label="Moyenne générale"
          value={avg ?? "—"}
          unit={avg ? "/20" : undefined}
        />
        <KpiBlock
          icon={<Trophy className="h-4 w-4" />}
          label="Rang"
          value={rankLabel}
          accent={bulletin.rank === 1}
        />
        <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Mention
          </span>
          <span className={getMentionBadgeClass(bulletin.mention)}>
            {bulletin.mention ?? "—"}
          </span>
          {bulletin.mention && (
            <span className="text-xs text-muted-foreground">
              {mentionFullLabel(bulletin.mention)}
            </span>
          )}
        </div>
      </section>

      <section className="space-y-4 px-6 py-5">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Détail par matière
          </h3>
          {bulletin.subject_averages.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
              Aucune note saisie pour ce trimestre.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Matière</th>
                    <th className="px-3 py-2 text-center font-medium">Coef.</th>
                    <th className="px-3 py-2 text-right font-medium">Moyenne</th>
                  </tr>
                </thead>
                <tbody>
                  {bulletin.subject_averages.map((sa) => {
                    const avgNum = Number(sa.average)
                    return (
                      <tr key={sa.subject_id} className="border-t last:border-b-0">
                        <td className="px-3 py-2 font-medium text-foreground">
                          {sa.subject_name}
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">
                          {sa.coefficient}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={cn(
                              "font-mono font-semibold tabular-nums",
                              avgNum < 10 ? "text-rose-700" : "text-foreground",
                            )}
                          >
                            {avgNum.toFixed(2)}
                          </span>
                          <span className="ml-0.5 text-xs text-muted-foreground">
                            /20
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {bulletin.teacher_comment && (
          <div className="rounded-lg border bg-muted/10 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Commentaire de l&apos;enseignant
            </p>
            <p className="text-sm text-foreground">{bulletin.teacher_comment}</p>
          </div>
        )}

        {bulletin.council_decision && (
          <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conseil de classe
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                Décision : {COUNCIL_DECISION_LABELS[bulletin.council_decision]}
              </p>
            </div>
          </div>
        )}

        <Separator className="opacity-0" />
      </section>
    </div>
  )
}

function StudentAvatar({
  name,
  photoUrl,
}: {
  name: string
  photoUrl?: string | null
}) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?"
  const photoSrc = getUploadUrl(photoUrl ?? undefined)
  if (photoSrc) {
    return (
      <img
        src={photoSrc}
        alt={name}
        className="h-14 w-14 shrink-0 rounded-xl border-2 border-background object-cover shadow-sm ring-1 ring-border"
      />
    )
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-background bg-gradient-to-br from-primary to-primary/70 shadow-sm ring-1 ring-border">
      <span className="text-base font-semibold text-primary-foreground">
        {initials}
      </span>
    </div>
  )
}

function KpiBlock({
  icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-5">
      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-2xl font-bold tabular-nums",
          accent ? "text-emerald-700" : "text-foreground",
        )}
      >
        {value}
        {unit && (
          <span className="ml-0.5 text-sm font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </span>
    </div>
  )
}

function BulletinPreviewSkeleton() {
  return (
    <div className="p-6">
      <Skeleton className="mb-2 h-3 w-48" />
      <Skeleton className="mb-4 h-6 w-72" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <div className="my-6 grid grid-cols-3 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-32" />
    </div>
  )
}
