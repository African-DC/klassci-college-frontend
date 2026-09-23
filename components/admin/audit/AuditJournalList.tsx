"use client"

import { ChevronRight } from "lucide-react"
import type { AuditEntry } from "@/lib/contracts/audit"
import { AuditActionBadge } from "./AuditActionBadge"
import { AuditChangeSummary } from "./AuditChangeSummary"
import { AuditSubject } from "./AuditSubject"
import { formatStamp, roleLabel } from "./audit-labels"

interface AuditJournalListProps {
  items: AuditEntry[]
  onSelect: (entry: AuditEntry) => void
}

function auteur(entry: AuditEntry): string {
  return entry.actor_name ?? entry.actor_email ?? "Compte supprimé"
}

/**
 * Les lignes du journal : un tableau sur grand écran, des cartes sur téléphone.
 *
 * Chaque ligne dit sur qui porte l'action par son nom, et, pour une
 * modification, ce qui a changé, sans avoir à ouvrir le détail.
 */
export function AuditJournalList({ items, onSelect }: AuditJournalListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">Quand</th>
              <th className="px-3 py-2.5 text-left font-medium">Qui</th>
              <th className="px-3 py-2.5 text-left font-medium">Action</th>
              <th className="px-3 py-2.5 text-left font-medium">Sur quoi</th>
              <th className="px-3 py-2.5 text-left font-medium">Ce qui a changé</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {items.map((entry) => {
              const stamp = formatStamp(entry.created_at)
              return (
                <tr
                  key={entry.id}
                  className="cursor-pointer border-b align-top transition-colors last:border-0 hover:bg-muted/50"
                  onClick={() => onSelect(entry)}
                >
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <p className="font-medium">{stamp.date}</p>
                    <p className="text-xs text-muted-foreground">{stamp.time}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{auteur(entry)}</p>
                    <p className="text-xs text-muted-foreground">
                      {roleLabel(entry.actor_role) ?? entry.actor_email ?? "—"}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <AuditActionBadge action={entry.action} />
                  </td>
                  <td className="max-w-[16rem] px-3 py-2.5">
                    <AuditSubject entry={entry} />
                  </td>
                  <td className="max-w-[20rem] px-3 py-2.5">
                    <AuditChangeSummary entry={entry} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <ChevronRight aria-hidden="true" className="ml-auto h-4 w-4 text-muted-foreground" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {items.map((entry) => {
          const stamp = formatStamp(entry.created_at)
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelect(entry)}
              className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <AuditActionBadge action={entry.action} />
                </div>
                <AuditSubject entry={entry} />
                <AuditChangeSummary entry={entry} />
                <p className="text-xs text-muted-foreground">
                  {auteur(entry)} · {stamp.date} à {stamp.time}
                </p>
              </div>
              <ChevronRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          )
        })}
      </div>
    </>
  )
}
