"use client"

import { Gift, KeyRound, PackageCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { FeeEntitlement } from "@/lib/contracts/fee"

/**
 * Ce qu'un frais donne droit, côté écran.
 *
 * Deux façons de le montrer, une seule source : la liste dépliée pour les
 * pages où la place existe, et un déclencheur discret ailleurs. On sépare
 * toujours ce qui se retire au guichet de ce qui est un droit d'accès, parce
 * que c'est cette distinction qui tranche quand un parent revient réclamer
 * une tenue qu'il a payée.
 *
 * Un déclencheur plutôt qu'une infobulle : sur le téléphone de Mme Diallo,
 * une infobulle au survol n'existe pas. Un bouton qu'on touche, si.
 */

function label(element: FeeEntitlement): string {
  return element.quantity ? `${element.quantity} ${element.label}` : element.label
}

interface EntitlementsListProps {
  /** Absent tant que le backend ne renvoie pas encore le champ. */
  entitlements: FeeEntitlement[] | undefined
  /** Note libre de la catégorie, montrée quand aucun élément n'est saisi. */
  fallbackNote?: string | null
  className?: string
}

/** La liste dépliée : « Remis » d'abord, « Accès » ensuite. */
export function EntitlementsList({
  entitlements,
  fallbackNote,
  className,
}: EntitlementsListProps) {
  const remis = (entitlements ?? []).filter((e) => e.kind === "item")
  const acces = (entitlements ?? []).filter((e) => e.kind === "access")

  if (remis.length === 0 && acces.length === 0) {
    if (!fallbackNote) {
      return (
        <p className={cn("text-xs text-muted-foreground", className)}>
          Aucune contrepartie n&apos;a encore été décrite pour ce frais.
        </p>
      )
    }
    return <p className={cn("text-xs text-muted-foreground", className)}>{fallbackNote}</p>
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {remis.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <PackageCheck className="h-3.5 w-3.5" />À retirer
          </p>
          <ul className="space-y-0.5 pl-5">
            {remis.map((e, i) => (
              <li key={`${e.label}-${i}`} className="list-disc text-xs text-foreground">
                {label(e)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {acces.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <KeyRound className="h-3.5 w-3.5" />
            Accès ouverts
          </p>
          <ul className="space-y-0.5 pl-5">
            {acces.map((e, i) => (
              <li key={`${e.label}-${i}`} className="list-disc text-xs text-foreground">
                {label(e)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface EntitlementsPopoverProps {
  categoryName: string
  entitlements: FeeEntitlement[] | undefined
  fallbackNote?: string | null
  className?: string
}

/**
 * Déclencheur compact : ne s'affiche pas du tout quand le frais ne promet
 * rien. Un bouton « ce que ça couvre » qui ouvre sur « rien de décrit »
 * ferait douter la famille de tout le reste.
 */
export function EntitlementsPopover({
  categoryName,
  entitlements,
  fallbackNote,
  className,
}: EntitlementsPopoverProps) {
  const aQuelqueChose = (entitlements?.length ?? 0) > 0 || Boolean(fallbackNote)
  if (!aQuelqueChose) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-11 gap-1.5 px-2 text-[11px] font-medium text-primary hover:bg-primary/10 sm:h-8",
            className,
          )}
          aria-label={`Ce que couvre ${categoryName}`}
        >
          <Gift className="h-3.5 w-3.5" />
          Ce que ça couvre
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <p className="mb-2 text-xs font-semibold">{categoryName}</p>
        <EntitlementsList entitlements={entitlements} fallbackNote={fallbackNote} />
      </PopoverContent>
    </Popover>
  )
}
