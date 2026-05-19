"use client"

import { Clock, Eye, Loader2, Pencil, Save, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface AvailabilityToolbarProps {
  editMode: boolean
  saving: boolean
  totalAvailable: number
  totalPreferred: number
  maxSlots: number
  pendingCount: number
  onEnterEdit: () => void
  onCancel: () => void
  onSave: () => void
}

export function AvailabilityToolbar({
  editMode,
  saving,
  totalAvailable,
  totalPreferred,
  maxSlots,
  pendingCount,
  onEnterEdit,
  onCancel,
  onSave,
}: AvailabilityToolbarProps) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Disponibilités</span>
            {!editMode ? (
              <Badge
                variant="outline"
                className="ml-2 gap-1 border-muted-foreground/30 text-[10px] uppercase tracking-wide text-muted-foreground"
              >
                <Eye className="h-3 w-3" />
                Lecture
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="ml-2 gap-1 border-primary/40 bg-primary/5 text-[10px] uppercase tracking-wide text-primary"
              >
                <Pencil className="h-3 w-3" />
                Édition
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {totalAvailable}/{maxSlots} disponibles
            </Badge>
            {totalPreferred > 0 && (
              <Badge variant="outline" className="text-xs text-primary">
                {totalPreferred} préférés
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs border-amber-400 text-amber-700 bg-amber-50"
              >
                {pendingCount} en attente
              </Badge>
            )}
            {!editMode ? (
              <Button size="sm" variant="outline" className="h-9" onClick={onEnterEdit}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Modifier
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9"
                  onClick={onCancel}
                  disabled={saving}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Annuler
                </Button>
                <Button size="sm" className="h-9" onClick={onSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Enregistrer
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {editMode
            ? "Cliquez pour basculer : indisponible → disponible → préféré → indisponible. Les modifications sont mises en attente jusqu'à « Enregistrer »."
            : "Mode lecture. Cliquez sur « Modifier » pour saisir les disponibilités."}
        </p>
      </CardContent>
    </Card>
  )
}


export function AvailabilityLegend({ pendingCount }: { pendingCount: number }) {
  return (
    <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-5 rounded-sm bg-emerald-500/20 ring-1 ring-emerald-500/30" />
        <span>Disponible</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-5 rounded-sm bg-primary/15 ring-1 ring-primary/30" />
        <span>Créneaux préférés</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-5 rounded-sm bg-rose-500/15 ring-1 ring-rose-300/40" />
        <span>Indisponible</span>
      </div>
      {pendingCount > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm ring-2 ring-dashed ring-amber-500/70" />
          <span>Modification en attente</span>
        </div>
      )}
    </div>
  )
}
