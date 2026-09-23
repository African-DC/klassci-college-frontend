"use client"

import Link from "next/link"
import type { Route } from "next"
import { ExternalLink } from "lucide-react"
import type { AuditEntry } from "@/lib/contracts/audit"
import { entityLabel } from "./audit-labels"

/** Types d'entités dont la fiche a une page où l'on peut se rendre. */
const ROUTES: Record<string, (id: number) => Route> = {
  student: (id) => `/admin/students/${id}` as Route,
  parent: (id) => `/admin/parents/${id}` as Route,
  teacher: (id) => `/admin/teachers/${id}` as Route,
  staff: (id) => `/admin/staff/${id}` as Route,
  class: (id) => `/admin/classes/${id}` as Route,
  enrollment: (id) => `/admin/enrollments/${id}` as Route,
}

/**
 * Les fiches que l'action touche aussi : l'élève derrière un versement,
 * l'évaluation derrière une note.
 *
 * Le libellé vient de la ligne de journal, figé au moment de l'acte. Il reste
 * donc lisible même quand la fiche a été supprimée depuis : dans ce cas le
 * nom s'affiche sans lien, ce qui est exactement ce qu'il faut montrer.
 */
export function AuditRelatedChips({ entry }: { entry: AuditEntry }) {
  const refs = (entry.related_entities ?? []).filter((r) => r.label || r.id)
  if (refs.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Fiches concernées
      </p>
      <div className="flex flex-wrap gap-2">
        {refs.map((ref, index) => {
          const kind = ref.type ?? ""
          // Le type est déjà écrit devant : sans nom, la puce dit « n° 5 » et
          // non « Inscription Inscription n° 5 ».
          const nom = ref.label ?? `n° ${ref.id}`
          const href = ref.id && ROUTES[kind] ? ROUTES[kind](ref.id) : null
          const inner = (
            <>
              <span className="text-muted-foreground">{entityLabel(kind)}</span>
              <span className="font-medium">{nom}</span>
              {href ? <ExternalLink aria-hidden="true" className="h-3 w-3 opacity-60" /> : null}
            </>
          )
          const className =
            "inline-flex h-11 items-center gap-1.5 rounded-full border bg-muted/40 px-3 text-sm sm:h-9"

          return href ? (
            <Link key={index} href={href} className={`${className} hover:bg-muted`}>
              {inner}
            </Link>
          ) : (
            <span key={index} className={className}>
              {inner}
            </span>
          )
        })}
      </div>
    </div>
  )
}
