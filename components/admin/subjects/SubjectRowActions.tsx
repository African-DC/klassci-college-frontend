"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Props {
  name: string
  size?: "desktop" | "mobile"
  onEdit?: () => void
  onAssign?: () => void
  onDelete?: () => void
}

export function SubjectRowActions({ name, size = "desktop", onEdit, onAssign, onDelete }: Props) {
  const compact = size === "desktop"
  const buttonClass = compact ? "h-8 w-8" : "h-11 w-11"
  return (
    <div className={cn("flex items-center justify-end gap-1", !compact && "w-full")}>
      {onEdit && (
        <Button variant="ghost" size="icon" className={buttonClass} aria-label={`Modifier ${name}`} onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
      {onAssign && (
        <Button variant="ghost" size="icon" className={buttonClass} aria-label={`Assigner ${name}`} onClick={onAssign}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      )}
      {onDelete && (
        <Button variant="ghost" size="icon" className={buttonClass} aria-label={`Supprimer ${name}`} onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      )}
    </div>
  )
}