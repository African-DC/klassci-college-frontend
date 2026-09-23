"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { AuditEntry } from "@/lib/contracts/audit"
import { AuditActionBadge } from "./AuditActionBadge"
import { AuditChangeTable } from "./AuditChangeTable"
import { AuditRelatedChips } from "./AuditRelatedChips"
import { actionVerb, entityLabel, formatStamp, roleLabel } from "./audit-labels"
import { entityHref } from "./audit-routes"

interface AuditDetailDialogProps {
  entry: AuditEntry | null
  onClose: () => void
}

/**
 * Le récit de la ligne, en une phrase, avant tout tableau.
 *
 * C'est ce qu'une directrice lit d'abord et ce qu'elle répète au téléphone à
 * un parent. Le détail champ par champ vient après, pour qui veut vérifier.
 */
function Recit({ entry }: { entry: AuditEntry }) {
  const stamp = formatStamp(entry.created_at)
  const qui = entry.actor_name ?? entry.actor_email ?? "Un compte supprimé"
  const quoi = entityLabel(entry.entity_type).toLowerCase()
  const sujet = entry.subject_label

  return (
    <p className="text-sm leading-relaxed">
      <span className="font-medium">{qui}</span>
      {roleLabel(entry.actor_role) ? (
        <span className="text-muted-foreground"> ({roleLabel(entry.actor_role)})</span>
      ) : null}{" "}
      {actionVerb(entry.action)}{" "}
      {entry.action === "login" || entry.action === "logout" ? null : (
        <>
          <span>{quoi}</span>{" "}
          {sujet ? (
            <span className="font-medium">{sujet}</span>
          ) : entry.entity_id ? (
            <span className="text-muted-foreground">n° {entry.entity_id}</span>
          ) : null}{" "}
        </>
      )}
      le {stamp.date} à {stamp.time}.
    </p>
  )
}

/**
 * Aller à la fiche dont parle la ligne, quand elle existe encore.
 *
 * C'est ce qui manquait pour s'y retrouver : lire « 6e B » dans le journal
 * sans pouvoir ouvrir la classe obligeait à la rechercher ailleurs. Une fiche
 * supprimée ou archivée n'a pas de lien, et le dit, plutôt que de mener à
 * une page vide.
 */
function OuvrirLaFiche({ entry }: { entry: AuditEntry }) {
  const href = entityHref(entry.entity_type, entry.entity_id)
  if (!href) return null
  if (entry.subject_state === "deleted") {
    return (
      <p className="text-xs text-muted-foreground">
        Cette fiche a été supprimée depuis : elle ne peut plus être ouverte.
      </p>
    )
  }
  if (entry.subject_state === "archived") {
    return (
      <p className="text-xs text-muted-foreground">
        Cette fiche a été archivée depuis : elle n&apos;apparaît plus dans les listes.
      </p>
    )
  }
  // État inconnu : on ne promet pas une page qui pourrait ne rien afficher.
  if (entry.subject_state !== "active") return null
  return (
    <Button asChild variant="outline" className="h-11 w-full sm:h-10 sm:w-auto">
      <Link href={href}>
        <ExternalLink aria-hidden="true" className="mr-2 h-4 w-4" />
        Ouvrir la fiche
      </Link>
    </Button>
  )
}

/**
 * Le détail d'une ligne : ce qui s'est passé, sur qui, et ce qui a changé.
 */
export function AuditDetailDialog({ entry, onClose }: AuditDetailDialogProps) {
  if (!entry) return null

  const stamp = formatStamp(entry.created_at)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] space-y-4 overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <AuditActionBadge action={entry.action} />
            <span>{entry.subject_label ?? entityLabel(entry.entity_type)}</span>
            {entry.subject_label ? (
              <span className="text-sm font-normal text-muted-foreground">
                {entityLabel(entry.entity_type)}
              </span>
            ) : entry.entity_id ? (
              <span className="text-sm font-normal text-muted-foreground">
                n° {entry.entity_id}
              </span>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        <OuvrirLaFiche entry={entry} />

        <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
          <Recit entry={entry} />
          <dl className="mt-3 grid gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground sm:grid-cols-2">
            {entry.actor_email ? (
              <div>
                <dt className="inline">Compte : </dt>
                <dd className="inline">{entry.actor_email}</dd>
              </div>
            ) : null}
            {entry.ip_address ? (
              <div>
                <dt className="inline">Depuis : </dt>
                <dd className="inline">{entry.ip_address}</dd>
              </div>
            ) : null}
            <div>
              <dt className="inline">Horodatage : </dt>
              <dd className="inline">
                {stamp.date} à {stamp.time}
              </dd>
            </div>
          </dl>
        </div>

        {entry.notes ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="text-xs font-semibold uppercase tracking-wide">Motif indiqué</p>
            <p className="mt-1">{entry.notes}</p>
          </div>
        ) : null}

        <AuditRelatedChips entry={entry} />

        <AuditChangeTable entry={entry} />
      </DialogContent>
    </Dialog>
  )
}
