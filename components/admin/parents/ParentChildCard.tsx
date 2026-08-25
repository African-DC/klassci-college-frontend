"use client"

import Link from "next/link"
import type { Route } from "next"
import { GraduationCap, MoreVertical, Unlink, ArrowUpRight } from "lucide-react"
import { PaymentStatusBadge } from "@/components/shared/finance/PaymentStatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getUploadUrl } from "@/lib/utils"
import { formatXof } from "@/lib/export/format"
import type { ParentChild } from "@/lib/contracts/parent"

const RELATIONSHIP_LABEL: Record<string, string> = {
  father: "Père",
  mother: "Mère",
  guardian: "Tuteur",
  other: "Proche",
}

export function ParentChildCard({
  child,
  onUnlink,
}: {
  child: ParentChild
  onUnlink: (child: ParentChild) => void
}) {
  const initials = `${child.last_name?.[0] ?? ""}${child.first_name?.[0] ?? ""}`.toUpperCase()
  const photo = getUploadUrl(child.photo_url)
  const rel = RELATIONSHIP_LABEL[child.relationship_type] ?? child.relationship_type
  // Le solde vaut `null` quand l'appelant n'a pas le droit de lire les
  // montants : on affiche alors l'état de paiement, jamais une somme. On
  // resserre le type une seule fois ici plutôt qu'à chaque affichage.
  const amountsHidden = child.fees_balance == null
  const expected = child.fees_expected ?? 0
  const paid = child.fees_paid ?? 0
  const balance = child.fees_balance ?? 0
  const paidRatio = expected > 0 ? Math.min(100, (paid / expected) * 100) : 0
  const settled = !amountsHidden && expected > 0 && balance <= 0

  return (
    <div className="rounded-lg border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_rgba(4,83,203,0.35)]">
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 shrink-0 rounded-xl">
          {photo ? <AvatarImage src={photo} alt={child.student_name} className="object-cover" /> : null}
          <AvatarFallback className="rounded-xl bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {child.last_name} {child.first_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {rel}
            {child.matricule ? ` · N° ${child.matricule}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {child.is_enrolled && child.class_name ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <GraduationCap className="h-3 w-3" aria-hidden="true" />
                {child.class_name}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                Pas inscrit cette année
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Actions sur l&apos;enfant</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/admin/students/${child.student_id}` as Route}>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Voir la fiche élève
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onUnlink(child)}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Unlink className="mr-2 h-4 w-4" />
              Retirer de ce parent
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Situation financière (année courante) */}
      {child.is_enrolled && amountsHidden ? (
        <div className="mt-3 rounded-md border border-border/60 bg-muted/40 p-2.5">
          <PaymentStatusBadge
            status={child.fee_status}
            lastPaymentDate={child.last_payment_date}
          />
        </div>
      ) : child.is_enrolled && expected > 0 ? (
        <div className="mt-3 rounded-md border border-border/60 bg-muted/40 p-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Scolarité</span>
            {settled ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">À jour</span>
            ) : (
              <span className="font-semibold text-accent">
                Reste {formatXof(balance)}
              </span>
            )}
          </div>
          <Progress
            value={paidRatio}
            className={cn("mt-1.5 h-1.5", settled && "[&>*]:bg-emerald-500")}
            aria-label={`${Math.round(paidRatio)}% payé`}
          />
          <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
            {formatXof(paid)} / {formatXof(expected)}
          </p>
        </div>
      ) : child.is_enrolled ? (
        <p className="mt-2 text-[11px] text-muted-foreground">Aucun frais configuré.</p>
      ) : null}
    </div>
  )
}
