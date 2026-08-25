"use client"

import { Loader2 } from "lucide-react"
import type { Class } from "@/lib/contracts/class"
import type { FeeVariantOption } from "@/lib/contracts/enrollment"
import { classCapacity, classCapacityLabel } from "@/lib/enrollment/classCapacity"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface ClassFeesFieldsProps {
  classes: Class[]
  classesLoading: boolean
  feeVariants: FeeVariantOption[]
  feeVariantsLoading: boolean
  classId: number | undefined
  feeVariantId: number | null | undefined
  notes: string | null | undefined
  onClassChange: (id: number) => void
  onFeeVariantChange: (id: number | null) => void
  onNotesChange: (val: string | null) => void
  classError?: string
}

function formatXof(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(amount)
}

function ClassCapacityHint({ classes, classId }: { classes: Class[]; classId: number }) {
  const selected = classes.find((item) => item.id === classId)
  if (!selected) return null
  const { enrolled, max, available } = classCapacity(selected)
  if (max == null || available == null) return null
  if (available === 0) {
    return (
      <p className="text-sm text-destructive">
        Cette classe est complète ({enrolled}/{max}). Choisissez une autre classe.
      </p>
    )
  }
  const tone = available / max <= 0.3 ? "text-amber-700" : "text-emerald-700"
  const place = available > 1 ? "places" : "place"
  const inscrit = enrolled > 1 ? "inscrits" : "inscrit"
  return (
    <p className={`text-sm ${tone}`}>
      {available} {place} disponible{available > 1 ? "s" : ""} · {enrolled} {inscrit} sur {max}
    </p>
  )
}

export function ClassAndFeesFields({
  classes,
  classesLoading,
  feeVariants,
  feeVariantsLoading,
  classId,
  feeVariantId,
  notes,
  onClassChange,
  onFeeVariantChange,
  onNotesChange,
  classError,
}: ClassFeesFieldsProps) {
  const mandatory = feeVariants.filter((variant) => variant.is_mandatory !== false)
  const optional = feeVariants.filter((variant) => variant.is_mandatory === false)
  const mandatoryTotal = mandatory.reduce((sum, variant) => sum + Number(variant.amount), 0)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Classe *</label>
        <Select
          value={classId ? String(classId) : ""}
          onValueChange={(value) => {
            onClassChange(Number(value))
            onFeeVariantChange(null)
          }}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder={classesLoading ? "Chargement..." : "Sélectionner une classe"} />
          </SelectTrigger>
          <SelectContent>
            {classes.map((item) => {
              const capacity = classCapacity(item)
              return (
                <SelectItem key={item.id} value={String(item.id)} disabled={capacity.full}>
                  {classCapacityLabel(item.name, capacity)}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        {classId ? <ClassCapacityHint classes={classes} classId={classId} /> : null}
        {classError ? <p className="text-sm font-medium text-destructive">{classError}</p> : null}
      </div>

      {feeVariantsLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des frais...
        </div>
      ) : null}

      {mandatory.length > 0 ? (
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            Frais obligatoires
            <span className="ml-2 text-xs font-normal text-muted-foreground">(appliqués automatiquement)</span>
          </label>
          <Card className="border-border/50 bg-muted/30">
            <CardContent className="p-0">
              {mandatory.map((variant, index) => (
                <div
                  key={variant.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5",
                    index < mandatory.length - 1 && "border-b border-border/30",
                  )}
                >
                  <span className="text-sm">{variant.category_name ?? variant.description ?? "Frais"}</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {formatXof(variant.amount)}
                  </Badge>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border bg-primary/5 px-4 py-2.5">
                <span className="text-sm font-semibold">Total obligatoire</span>
                <span className="font-mono font-bold text-primary">{formatXof(mandatoryTotal)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {optional.length > 0 ? (
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Frais optionnels</label>
          <div className="grid grid-cols-1 gap-2">
            {optional.map((variant) => (
              <Card
                key={variant.id}
                className={cn(
                  "cursor-pointer transition-colors hover:border-primary/50",
                  feeVariantId === variant.id && "border-primary ring-2 ring-primary/20",
                )}
                onClick={() => onFeeVariantChange(feeVariantId === variant.id ? null : variant.id)}
              >
                <CardContent className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border-2",
                        feeVariantId === variant.id
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30",
                      )}
                    >
                      {feeVariantId === variant.id ? (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </div>
                    <span className="text-sm">{variant.category_name ?? variant.description ?? "Option"}</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {formatXof(variant.amount)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Notes</label>
        <Textarea
          placeholder="Notes optionnelles"
          className="min-h-24 resize-none"
          value={notes ?? ""}
          onChange={(event) => onNotesChange(event.target.value || null)}
        />
      </div>
    </div>
  )
}
