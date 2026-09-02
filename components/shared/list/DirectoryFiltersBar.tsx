"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ListSearchBar } from "@/components/shared/list/ListSearchBar"

/**
 * Barre de recherche + filtres, toujours visible — y compris sur un téléphone.
 *
 * Sur les listes d'élèves, d'inscriptions, de personnel, la recherche vivait
 * dans le tableau desktop (`hidden md:block`). Au guichet, on n'avait plus
 * que les cartes, sans aucun moyen de retrouver Diallo.
 *
 * Même carte que le journal des versements : recherche d'abord, filtres à
 * côté, réinitialiser quand quelque chose est posé.
 */
export function DirectoryFiltersBar({
  search,
  onSearchChange,
  placeholder,
  children,
  activeCount = 0,
  onReset,
}: {
  search: string
  onSearchChange: (value: string) => void
  placeholder: string
  children?: ReactNode
  activeCount?: number
  onReset?: () => void
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <ListSearchBar
            value={search}
            onChange={onSearchChange}
            placeholder={placeholder}
            className="min-w-[240px] flex-1 sm:max-w-none"
          />
          {children}
          {activeCount > 0 && onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-10 text-xs text-muted-foreground"
            >
              <X className="mr-1 h-3 w-3" />
              Réinitialiser ({activeCount})
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
