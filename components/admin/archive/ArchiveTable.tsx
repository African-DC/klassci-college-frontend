"use client"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { entityLabel, formatStamp } from "@/components/admin/audit/audit-labels"
import type { ArchiveEntry } from "@/lib/contracts/archive"
import { ArchiveRowActions } from "./ArchiveRowActions"

interface ArchiveTableProps {
  items: ArchiveEntry[]
  canPurge: boolean
}

/** Vue large. La version tactile de la même liste vit dans `ArchiveCards`. */
export function ArchiveTable({ items, canPurge }: ArchiveTableProps) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border md:block">
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow>
            <TableHead>Fiche</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Archivée par</TableHead>
            <TableHead>Quand</TableHead>
            <TableHead>Motif</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((entry) => {
            const stamp = entry.archived_at ? formatStamp(entry.archived_at) : null
            return (
              <TableRow key={`${entry.entity_type}-${entry.entity_id}`}>
                <TableCell className="font-medium">
                  {entry.label ?? `Fiche nº ${entry.entity_id}`}
                  <p className="text-xs font-normal text-muted-foreground">
                    nº {entry.entity_id}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{entityLabel(entry.entity_type)}</Badge>
                </TableCell>
                <TableCell>{entry.archived_by_name ?? "Auteur inconnu"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {stamp ? (
                    <>
                      <p>{stamp.date}</p>
                      <p className="text-xs text-muted-foreground">{stamp.time}</p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Date inconnue</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs">
                  {/* Le motif est la seule trace de la décision : on le montre
                      en entier au survol plutôt que de le couper en silence. */}
                  <p
                    className="line-clamp-2 text-sm text-muted-foreground"
                    title={entry.archive_reason ?? undefined}
                  >
                    {entry.archive_reason ?? "Aucun motif enregistré"}
                  </p>
                </TableCell>
                <TableCell>
                  <ArchiveRowActions entry={entry} canPurge={canPurge} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
