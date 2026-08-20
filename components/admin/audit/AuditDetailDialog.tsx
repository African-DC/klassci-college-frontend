"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { AuditEntry } from "@/lib/contracts/audit"
import { AuditActionBadge } from "./AuditActionBadge"
import { entityLabel, formatStamp, roleLabel } from "./audit-labels"

interface AuditDetailDialogProps {
  entry: AuditEntry | null
  onClose: () => void
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

/**
 * Le détail d'une ligne, avec l'avant et l'après côte à côte.
 *
 * On ne montre que les champs qui ont réellement changé : une modification de
 * numéro de téléphone au milieu de quarante champs identiques serait
 * introuvable, et c'est exactement ce qu'on vient chercher ici.
 */
export function AuditDetailDialog({ entry, onClose }: AuditDetailDialogProps) {
  if (!entry) return null

  const before = entry.old_values ?? {}
  const after = entry.new_values ?? {}
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).filter(
    (key) => renderValue(before[key]) !== renderValue(after[key]),
  )
  const stamp = formatStamp(entry.created_at)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <AuditActionBadge action={entry.action} />
            <span>{entityLabel(entry.entity_type)}</span>
            {entry.entity_id ? (
              <span className="text-sm font-normal text-muted-foreground">#{entry.entity_id}</span>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        <dl className="grid gap-3 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Auteur</dt>
            <dd className="font-medium">{entry.actor_name ?? entry.actor_email ?? "Compte supprimé"}</dd>
            {entry.actor_email ? (
              <dd className="text-xs text-muted-foreground">{entry.actor_email}</dd>
            ) : null}
            {roleLabel(entry.actor_role) ? (
              <dd className="text-xs text-muted-foreground">{roleLabel(entry.actor_role)}</dd>
            ) : null}
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Quand</dt>
            <dd className="font-medium">
              {stamp.date} à {stamp.time}
            </dd>
            {entry.ip_address ? (
              <dd className="text-xs text-muted-foreground">Depuis {entry.ip_address}</dd>
            ) : null}
          </div>
        </dl>

        {entry.notes ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="text-xs font-semibold uppercase tracking-wide">Motif indiqué</p>
            <p className="mt-1">{entry.notes}</p>
          </div>
        ) : null}

        {keys.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Champ</th>
                  <th className="px-3 py-2 text-left font-medium">Avant</th>
                  <th className="px-3 py-2 text-left font-medium">Après</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{key}</td>
                    <td className="px-3 py-2 text-muted-foreground">{renderValue(before[key])}</td>
                    <td className="px-3 py-2">{renderValue(after[key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            {entry.action === "read"
              ? "Une consultation ne modifie rien : il n'y a pas de valeurs à comparer."
              : "Aucune valeur enregistrée pour cette action."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
