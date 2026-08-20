"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { AuditFilters, AuditQuery } from "@/lib/contracts/audit"
import { actionLabel, entityLabel } from "./audit-labels"

interface AuditFilterBarProps {
  filters: AuditFilters | undefined
  query: AuditQuery
  onChange: (patch: Partial<AuditQuery>) => void
  onReset: () => void
}

/**
 * Filtres en pastilles plutôt qu'en menus déroulants : une pastille dit ce
 * qu'elle vaut sans qu'on l'ouvre, et se touche du pouce. Les listes n'offrent
 * que ce qui existe réellement dans le journal visible — proposer un filtre
 * qui ne rend rien fait douter de l'écran.
 */
export function AuditFilterBar({ filters, query, onChange, onReset }: AuditFilterBarProps) {
  const hasActiveFilter = Boolean(
    query.action || query.entity_type || query.user_id || query.date_from || query.date_to || query.search,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Chip active={!query.action} onClick={() => onChange({ action: undefined })}>
          Toutes les actions
        </Chip>
        {(filters?.actions ?? []).map((action) => (
          <Chip
            key={action}
            active={query.action === action}
            onClick={() => onChange({ action: query.action === action ? undefined : action })}
          >
            {actionLabel(action)}
          </Chip>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="audit-entity">Type d&apos;information</Label>
          <select
            id="audit-entity"
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm sm:h-10"
            value={query.entity_type ?? ""}
            onChange={(e) => onChange({ entity_type: e.target.value || undefined })}
          >
            <option value="">Tout</option>
            {(filters?.entity_types ?? []).map((slug) => (
              <option key={slug} value={slug}>
                {entityLabel(slug)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-actor">Personne</Label>
          <select
            id="audit-actor"
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm sm:h-10"
            value={query.user_id ?? ""}
            onChange={(e) => onChange({ user_id: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Tout le monde</option>
            {(filters?.actors ?? []).map((actor) => (
              <option key={actor.user_id} value={actor.user_id}>
                {actor.name ?? actor.email ?? `Compte #${actor.user_id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-from">Du</Label>
          <Input
            id="audit-from"
            type="date"
            className="h-11 sm:h-10"
            value={query.date_from ?? ""}
            onChange={(e) => onChange({ date_from: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-to">Au</Label>
          <Input
            id="audit-to"
            type="date"
            className="h-11 sm:h-10"
            value={query.date_to ?? ""}
            onChange={(e) => onChange({ date_to: e.target.value || undefined })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Rechercher une adresse, un type, un motif…"
          className="h-11 sm:h-10"
          value={query.search ?? ""}
          onChange={(e) => onChange({ search: e.target.value || undefined })}
        />
        {hasActiveFilter ? (
          <Button variant="outline" className="h-11 shrink-0 sm:h-10" onClick={onReset}>
            Tout effacer
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 rounded-full border px-3.5 text-sm font-medium transition-colors",
        active
          ? "border-transparent bg-accent text-accent-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}
