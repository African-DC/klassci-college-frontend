"use client"

import { useMemo, useState } from "react"
import { Eye, PencilLine, ScrollText, Users } from "lucide-react"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuditFilters, useAuditJournal } from "@/lib/hooks/useAudit"
import type { AuditEntry, AuditQuery } from "@/lib/contracts/audit"
import { AuditDetailDialog } from "./AuditDetailDialog"
import { AuditFilterBar } from "./AuditFilterBar"
import { AuditJournalList } from "./AuditJournalList"

const PAGE_SIZE = 50

/**
 * Le journal de l'établissement : qui a fait quoi, sur quelle fiche, quand.
 *
 * Le comptable n'y voit que les écritures d'argent. L'écran le dit au lieu de
 * lui laisser croire qu'il regarde la totalité : un journal partiel qu'on
 * prend pour complet est pire qu'une absence de journal.
 */
export function AuditJournalClient() {
  const [query, setQuery] = useState<AuditQuery>({ page: 1, size: PAGE_SIZE })
  const [selected, setSelected] = useState<AuditEntry | null>(null)

  const { data: filters } = useAuditFilters()
  const { data, isLoading, isError, error, refetch } = useAuditJournal(query)

  const items = useMemo(() => data?.items ?? [], [data])
  const total = data?.total ?? 0
  const page = query.page ?? 1
  const lastPage = Math.max(1, Math.ceil(total / (query.size ?? PAGE_SIZE)))

  const kpis: HeroKpi[] = useMemo(() => {
    const reads = items.filter((entry) => entry.action === "read").length
    const actors = new Set(items.map((entry) => entry.user_id).filter(Boolean)).size
    return [
      { label: "Entrées trouvées", value: total, icon: ScrollText },
      { label: "Dont consultations", value: reads, icon: Eye, hint: "sur cette page" },
      { label: "Modifications", value: items.length - reads, icon: PencilLine, hint: "sur cette page" },
      { label: "Personnes", value: actors, icon: Users, hint: "sur cette page" },
    ]
  }, [items, total])

  function patch(next: Partial<AuditQuery>) {
    // Tout changement de filtre ramène en page 1 : rester en page 7 d'un
    // résultat qui n'en compte plus que 2 donne un écran vide inexplicable.
    setQuery((current) => ({ ...current, ...next, page: 1 }))
  }

  return (
    <div className="space-y-6">
      <PageHero
        icon={ScrollText}
        title="Journal d'audit"
        subtitle={
          filters?.scope === "financial"
            ? "Les écritures liées à l'argent : versements, frais, caisses"
            : "Tout ce qui est consulté, créé, modifié ou supprimé"
        }
        kpis={kpis}
      />

      <Card className="rounded-xl border shadow-sm">
        <CardContent className="space-y-5 p-5">
          <AuditFilterBar
            filters={filters}
            query={query}
            onChange={patch}
            onReset={() => setQuery({ page: 1, size: PAGE_SIZE })}
          />

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
              <p className="text-sm font-medium text-rose-900 dark:text-rose-100">
                {error instanceof Error ? error.message : "Le journal n'a pas pu être chargé."}
              </p>
              <Button variant="outline" className="mt-3 h-11 sm:h-10" onClick={() => void refetch()}>
                Réessayer
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <ScrollText aria-hidden="true" className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Aucune entrée pour ces critères</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Élargissez la période ou retirez un filtre.
              </p>
            </div>
          ) : (
            <>
              <AuditJournalList items={items} onSelect={setSelected} />

              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs text-muted-foreground">
                  Page {page} sur {lastPage} · {total} entrée{total > 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="h-11 sm:h-10"
                    disabled={page <= 1}
                    onClick={() => setQuery((c) => ({ ...c, page: Math.max(1, (c.page ?? 1) - 1) }))}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 sm:h-10"
                    disabled={page >= lastPage}
                    onClick={() => setQuery((c) => ({ ...c, page: (c.page ?? 1) + 1 }))}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AuditDetailDialog entry={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
