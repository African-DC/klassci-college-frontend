"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Class } from "@/lib/contracts/class"
import type { FeeCategory } from "@/lib/contracts/fee"

/**
 * Ce sur quoi porte le document : un frais, une période, et une classe si l'on
 * veut resserrer.
 *
 * **La catégorie d'abord, et sans valeur par défaut.** Ouvrir sur un frais
 * choisi au hasard donnerait un total qu'on croirait avoir demandé — et ce
 * total part chez un prestataire. On préfère un écran qui attend.
 *
 * **La classe est facultative**, et vide veut dire toute l'école : c'est la
 * lecture qu'on vient chercher, la classe ne fait que réduire.
 */
export function LedgerFilters({
  categories,
  categoriesLoading,
  categoryId,
  onCategory,
  classes,
  classId,
  onClass,
  dateFrom,
  dateTo,
  onPeriod,
}: {
  categories: FeeCategory[]
  categoriesLoading?: boolean
  categoryId: number | undefined
  onCategory: (id: number) => void
  classes: Class[]
  classId: number | undefined
  onClass: (id: number | undefined) => void
  dateFrom: string
  dateTo: string
  onPeriod: (bornes: { from?: string; to?: string }) => void
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="ledger-categorie" className="text-xs text-muted-foreground">
            Catégorie de frais
          </Label>
          {categoriesLoading ? (
            <Skeleton className="mt-1 h-11 w-full" />
          ) : (
            <Select
              value={categoryId ? String(categoryId) : undefined}
              onValueChange={(v) => onCategory(Number(v))}
              disabled={categories.length === 0}
            >
              <SelectTrigger id="ledger-categorie" className="mt-1 h-11 sm:h-10">
                <SelectValue placeholder="Choisir un frais" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)} className="py-2.5">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="min-w-0">
          <Label htmlFor="ledger-classe" className="text-xs text-muted-foreground">
            Classe <span className="font-normal">(facultatif)</span>
          </Label>
          <Select
            value={classId ? String(classId) : "toutes"}
            onValueChange={(v) => onClass(v === "toutes" ? undefined : Number(v))}
          >
            <SelectTrigger id="ledger-classe" className="mt-1 h-11 sm:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes" className="py-2.5">
                Toutes les classes
              </SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)} className="py-2.5">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0">
          <Label htmlFor="ledger-du" className="text-xs text-muted-foreground">
            Du
          </Label>
          <Input
            id="ledger-du"
            type="date"
            value={dateFrom}
            onChange={(e) => onPeriod({ from: e.target.value })}
            className="mt-1 h-11 sm:h-10"
          />
        </div>

        <div className="min-w-0">
          <Label htmlFor="ledger-au" className="text-xs text-muted-foreground">
            Au <span className="font-normal">(inclus)</span>
          </Label>
          <Input
            id="ledger-au"
            type="date"
            value={dateTo}
            onChange={(e) => onPeriod({ to: e.target.value })}
            className="mt-1 h-11 sm:h-10"
          />
        </div>
      </CardContent>
    </Card>
  )
}
