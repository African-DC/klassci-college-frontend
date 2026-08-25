"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RegisterPaginationProps {
  total: number
  page: number
  size: number
  onPageChange: (page: number) => void
  /** « convocation » / « billet » — accordé au singulier, pluriel ajouté ici. */
  noun: string
}

/**
 * Pied de registre : combien de lignes en tout, et de quoi changer de page.
 *
 * Les deux registres de vie scolaire s'empilent d'une année sur l'autre et ne
 * sont jamais purgés. Ils sont donc servis par pages, et le total répond à la
 * question que la page seule ne peut pas trancher : combien y en a-t-il.
 */
export function RegisterPagination({
  total,
  page,
  size,
  onPageChange,
  noun,
}: RegisterPaginationProps) {
  const lastPage = size > 0 ? Math.max(1, Math.ceil(total / size)) : 1
  if (total <= size) {
    return (
      <p className="text-xs text-muted-foreground">
        {total} {noun}
        {total > 1 ? "s" : ""}
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>
        {total} {noun}
        {total > 1 ? "s" : ""} au total
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-11 gap-1.5 sm:h-9"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Précédente
        </Button>
        <span aria-live="polite">
          Page {page} sur {lastPage}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-11 gap-1.5 sm:h-9"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Suivante
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
