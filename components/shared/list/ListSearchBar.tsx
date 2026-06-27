"use client"

import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/**
 * Barre de recherche standard des listes (Input shadcn + icône loupe + bouton
 * effacer). Présentationnelle et contrôlée : le parent gère la valeur et le
 * filtrage (multi-champs via `matchesSearch`, ou param serveur). Touch target
 * h-11 sur mobile (persona Mme Diallo, Itel S661).
 */
interface ListSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  "aria-label"?: string
}

export function ListSearchBar({
  value,
  onChange,
  placeholder = "Rechercher…",
  className,
  "aria-label": ariaLabel,
}: ListSearchBarProps) {
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="h-11 pl-9 pr-9 sm:h-10"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Effacer la recherche"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
