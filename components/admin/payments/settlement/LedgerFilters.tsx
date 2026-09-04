"use client"

import { X } from "lucide-react"
import { ListSearchBar } from "@/components/shared/list/ListSearchBar"
import { Button } from "@/components/ui/button"
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
 * Ce sur quoi porte le document : un frais, une période, une classe si l'on
 * veut resserrer, et un nom si l'on cherche quelqu'un.
 *
 * **La catégorie d'abord, et sans valeur par défaut.** Ouvrir sur un frais
 * choisi au hasard donnerait un total qu'on croirait avoir demandé — et ce
 * total part chez un prestataire. On préfère un écran qui attend.
 *
 * **La classe est facultative**, et vide veut dire toute l'école : c'est la
 * lecture qu'on vient chercher, la classe ne fait que réduire.
 *
 * **Les puces disent ce qui est appliqué, et le défont.** Les champs sont
 * dispersés sur quatre colonnes ; une fois la page défilée jusqu'au tableau,
 * plus rien ne rappelle qu'une période est active — et un total réduit se lit
 * alors comme le total complet. La puce nomme le filtre et porte son retrait.
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
  recherche,
  onRecherche,
  onEffacer,
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
  recherche: string
  onRecherche: (q: string) => void
  /** Efface tout ce qui réduit la lecture — pas la catégorie, qui est le sujet. */
  onEffacer: () => void
}) {
  const nomDeClasse = classes.find((c) => c.id === classId)?.name
  const puces = [
    classId
      ? {
          cle: "classe",
          texte: `Classe : ${nomDeClasse ?? classId}`,
          retirer: () => onClass(undefined),
        }
      : null,
    dateFrom
      ? {
          cle: "du",
          texte: `À partir du ${jour(dateFrom)}`,
          retirer: () => onPeriod({ from: "" }),
        }
      : null,
    dateTo
      ? {
          cle: "au",
          texte: `Jusqu'au ${jour(dateTo)}`,
          retirer: () => onPeriod({ to: "" }),
        }
      : null,
    recherche
      ? {
          cle: "q",
          texte: `Recherche : « ${recherche} »`,
          retirer: () => onRecherche(""),
        }
      : null,
  ].filter((p): p is { cle: string; texte: string; retirer: () => void } => p !== null)

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ListSearchBar
            value={recherche}
            onChange={onRecherche}
            placeholder="Chercher un élève : nom, prénom ou matricule…"
            className="min-w-0 flex-1 sm:max-w-none"
          />
          {puces.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0 sm:h-10"
              onClick={onEffacer}
            >
              Tout effacer ({puces.length})
            </Button>
          ) : null}
        </div>

        {puces.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {puces.map((puce) => (
              <li key={puce.cle}>
                <button
                  type="button"
                  onClick={puce.retirer}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {puce.texte}
                  <X aria-hidden className="h-3.5 w-3.5" />
                  <span className="sr-only">Retirer ce filtre</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** `2026-09-04` devient `04/09/2026`, sans passer par un fuseau. */
function jour(iso: string): string {
  const [annee, mois, quantieme] = iso.split("-")
  return quantieme ? `${quantieme}/${mois}/${annee}` : iso
}
