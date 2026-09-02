"use client"

import { useMemo, useState } from "react"
import { Archive, CalendarClock, GraduationCap, Trash2, Users } from "lucide-react"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useInfiniteArchiveList } from "@/lib/hooks/useArchive"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useScrollSentinel } from "@/lib/hooks/useScrollSentinel"
import { PERSON_ENTITIES, type ArchiveQuery } from "@/lib/contracts/archive"
import { formatStamp } from "@/components/admin/audit/audit-labels"
import { ArchiveCards } from "./ArchiveCards"
import { ArchiveFilterChips } from "./ArchiveFilterChips"
import { ArchiveTable } from "./ArchiveTable"
import { DirectoryFiltersBar } from "@/components/shared/list/DirectoryFiltersBar"
import { matchesSearch } from "@/lib/utils/list-search"

const PAGE_SIZE = 25

/**
 * La corbeille de l'établissement.
 *
 * Archiver retire une fiche des écrans sans rien détruire : cet écran est la
 * porte de sortie de ce geste. Il doit donc rester lisible même quand le
 * backend renvoie des lignes incomplètes, parce que c'est précisément quand
 * quelque chose s'est mal passé qu'on vient ici.
 */
export function ArchiveClient() {
  const [entityType, setEntityType] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState("")

  const { has } = usePermissions()
  const canPurge = has("archive:purge")

  const query: ArchiveQuery = useMemo(
    () => ({ size: PAGE_SIZE, ...(entityType ? { entity_type: entityType } : {}) }),
    [entityType],
  )
  const { data, isLoading, isError, error, refetch, isFetching, scrollInfini } =
    useInfiniteArchiveList(query)

  const sentinelle = useScrollSentinel({
    actif: scrollInfini.resteAcharger && !scrollInfini.chargeEnCours,
    onApproche: scrollInfini.chargerSuite,
  })

  const items = useMemo(() => {
    const loaded = data?.items ?? []
    return loaded.filter((entry) =>
      matchesSearch([entry.label, entry.archived_by_name, entry.archive_reason], search),
    )
  }, [data, search])
  const total = data?.total ?? 0

  const kpis: HeroKpi[] = useMemo(() => {
    const students = items.filter((entry) => entry.entity_type === "student").length
    const people = items.filter((entry) => PERSON_ENTITIES.includes(entry.entity_type)).length
    // Le plus ancien de la page affichée : on ne prétend pas connaître le plus
    // ancien de toute la corbeille, on n'en a que cette page sous les yeux.
    const oldest = items
      .map((entry) => entry.archived_at)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(0)
    return [
      { label: "Éléments archivés", value: total, icon: Archive },
      { label: "Dont élèves", value: students, icon: GraduationCap, hint: "sur cette page" },
      { label: "Dont personnes", value: people, icon: Users, hint: "sur cette page" },
      {
        label: "Plus ancien",
        value: oldest ? formatStamp(oldest).date : "—",
        icon: CalendarClock,
        hint: "sur cette page",
      },
    ]
  }, [items, total])

  function changeFilter(next: string | undefined) {
    // Changer de filtre change la clé de requête : le défilement repart de la
    // première page de lui-même, il n'y a plus de compteur à remettre à zéro.
    setEntityType(next)
  }

  return (
    <div className="space-y-6">
      <PageHero
        icon={Archive}
        title="Corbeille"
        subtitle="Les fiches retirées des écrans, conservées et restaurables"
        kpis={kpis}
      />

      <Card className="rounded-xl border shadow-sm">
        <CardContent className="space-y-5 p-5">
          <DirectoryFiltersBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Rechercher une fiche archivée..."
          />
          <ArchiveFilterChips value={entityType} onChange={changeFilter} />

          {isLoading ? (
            <div className="space-y-2" aria-live="polite" aria-busy="true">
              <span className="sr-only">Chargement de la corbeille</span>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
              <p className="text-sm font-medium text-rose-900 dark:text-rose-100">
                {error instanceof Error ? error.message : "La corbeille n'a pas pu être chargée."}
              </p>
              <p className="mt-1 text-xs text-rose-800/80 dark:text-rose-200/80">
                Rien n&apos;est perdu : les fiches archivées restent conservées.
              </p>
              <Button
                variant="outline"
                className="mt-3 h-11 sm:h-10"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                Réessayer
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <Trash2 aria-hidden="true" className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">
                {entityType ? "Rien d'archivé pour ce type de fiche" : "La corbeille est vide"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {entityType
                  ? "Choisissez « Tout » pour voir le reste de la corbeille."
                  : "Une fiche archivée depuis son écran apparaîtra ici, prête à être restaurée."}
              </p>
            </div>
          ) : (
            <>
              <ArchiveTable items={items} canPurge={canPurge} />
              <ArchiveCards items={items} canPurge={canPurge} />

              {/* Charger la suite en approchant du bas : viser un numéro de
                  page au pouce était le geste que personne ne faisait. */}
              <div ref={sentinelle} aria-hidden="true" className="h-px" />
              <p className="text-center text-xs text-muted-foreground" aria-live="polite">
                {scrollInfini.chargeEnCours
                  ? "Chargement…"
                  : scrollInfini.resteAcharger
                    ? `${items.length} sur ${total}`
                    : `${total} élément${total > 1 ? "s" : ""}, tout est affiché`}
              </p>            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
