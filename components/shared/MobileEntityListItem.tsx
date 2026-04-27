"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Item de liste mobile minimal pour une entité (élève, enseignant, classe...).
 *
 * Persona-first (Mme Diallo, Itel S661, plein soleil) : pas de card volumineuse,
 * pas d'actions inline. Juste 4 infos visuelles + tap → fiche. Édition / suppression
 * se font depuis la fiche, pas la liste, pour éviter les fausses manipulations.
 *
 * Réutilisable sur /admin/teachers, /staff, /parents, /classes, etc. — d'où sa
 * place dans `components/shared/`.
 */
export interface MobileEntityListItemProps {
  href: string
  avatar: ReactNode
  primary: ReactNode
  secondary?: ReactNode
  status?: ReactNode
  className?: string
}

export function MobileEntityListItem({
  href,
  avatar,
  primary,
  secondary,
  status,
  className,
}: MobileEntityListItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-3 py-3 transition-colors",
        "hover:bg-accent/40 active:bg-accent/60",
        className,
      )}
    >
      <div className="shrink-0">{avatar}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium leading-tight">{primary}</span>
        </div>
        {secondary ? (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{secondary}</div>
        ) : null}
      </div>
      {status ? <div className="shrink-0">{status}</div> : null}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}
