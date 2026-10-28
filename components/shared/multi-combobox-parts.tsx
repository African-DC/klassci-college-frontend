"use client"

import { Loader2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ChipProps {
  label: string
  onRemove: () => void
}

/** Pastille retirable. Le clic sur la croix ne doit pas ouvrir la liste parente. */
export function MultiComboboxChip({ label, onRemove }: ChipProps) {
  return (
    <Badge variant="secondary" className="max-w-full gap-1 py-0.5 pl-2.5 pr-0.5 text-sm font-medium">
      <span className="truncate">{label}</span>
      <button
        type="button"
        aria-label={`Retirer ${label}`}
        onClick={(event) => {
          event.stopPropagation()
          onRemove()
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-muted-foreground/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
