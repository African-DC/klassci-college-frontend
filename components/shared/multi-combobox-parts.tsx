"use client"

import { Loader2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ChipProps {
  label: string
  disabled?: boolean
  onRemove: () => void
}

/**
 * Pastille retirable, placée hors du combobox. La croix garde un visuel de 24px,
 * mais sa zone cliquable fait 44px grâce au pseudo-élément (tactile, Itel S661).
 */
export function MultiComboboxChip({ label, disabled = false, onRemove }: ChipProps) {
  return (
    <Badge variant="secondary" className="max-w-full gap-1 py-0.5 pl-2.5 pr-1 text-sm font-medium">
      <span className="truncate">{label}</span>
      <button
        type="button"
        aria-label={`Retirer ${label}`}
        disabled={disabled}
        onClick={onRemove}
        className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-muted-foreground/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 after:absolute after:-inset-2.5 after:content-['']"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </Badge>
  )
}

export function MultiComboboxLoading({ text }: { text: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      <span>{text}</span>
    </div>
  )
}

interface ErrorProps {
  message: string
  onRetry?: () => void
}

export function MultiComboboxError({ message, onRetry }: ErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-3 py-6 text-center">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" className="h-11" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  )
}
