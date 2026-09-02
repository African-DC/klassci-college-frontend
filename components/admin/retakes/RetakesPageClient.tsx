"use client"

import { useState } from "react"
import { ClipboardList, FileCheck2, Plus, RotateCcw } from "lucide-react"
import { PageHero, heroAccentBtn, type HeroKpi } from "@/components/shared/PageHero"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import {
  useDownloadRetakeAuthorization,
  useInfiniteRetakeAuthorizations,
} from "@/lib/hooks/useRetakes"
import { RegisterFooter } from "@/components/shared/school-life/RegisterFooter"
import { RetakeCreateModal } from "./RetakeCreateModal"
import { RetakesList } from "./RetakesList"
import type { RetakeAuthorization } from "@/lib/contracts/school-life"
import { DirectoryFiltersBar } from "@/components/shared/list/DirectoryFiltersBar"
import { matchesSearch } from "@/lib/utils/list-search"

const TRIMESTER_FILTERS = [
  { key: 0, label: "Toute l'année" },
  { key: 1, label: "T1" },
  { key: 2, label: "T2" },
  { key: 3, label: "T3" },
]

const PAGE_SIZE = 20

export function RetakesPageClient() {
  const [search, setSearch] = useState("")
  const [trimester, setTrimester] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const { has, isLoading: loadingPermissions } = usePermissions()
  const canManage = has("documents:zero-cancellation")

  // Le registre n'est jamais purgé : sans borne sur l'année courante, l'écran
  // ouvrait sur toute l'histoire de l'établissement pour n'en montrer que le
  // haut.
  const { data: yearsData } = useAcademicYears()
  const years = yearsData?.items ?? []
  const currentYearId = (years.find((year) => year.is_current) ?? years[0])?.id

  const { data, isLoading, error, refetch, scrollInfini } = useInfiniteRetakeAuthorizations(
    {
      ...(currentYearId ? { academic_year_id: currentYearId } : {}),
      ...(trimester ? { trimester } : {}),
      size: PAGE_SIZE,
    },
    canManage && Boolean(currentYearId),
  )
  const { mutate: download } = useDownloadRetakeAuthorization()

  const items = (data?.items ?? []).filter((item) =>
    matchesSearch([item.student_name], search),
  )
  const total = data?.total ?? 0

  function changeTrimester(next: number) {
    setTrimester(next)
  }

  const kpis: HeroKpi[] = [
    { label: "Billets délivrés", value: isLoading ? "—" : total, icon: FileCheck2 },
    {
      label: "Évaluations rouvertes",
      value: isLoading ? "—" : (data?.reopened_evaluations ?? 0),
      icon: ClipboardList,
    },
  ]

  function handleDownload(authorization: RetakeAuthorization) {
    setDownloadingId(authorization.id)
    download(authorization, { onSettled: () => setDownloadingId(null) })
  }

  if (!loadingPermissions && !canManage) {
    return (
      <div className="space-y-6">
        <PageHero
          icon={RotateCcw}
          title="Autorisations de reprise"
          subtitle="Billets d'annulation de zéro pour absence justifiée"
        />
        <DataError
          message="Vous n'avez pas le droit de consulter les autorisations de reprise."
          error={new Error("Permission denied: documents:zero-cancellation")}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHero
        icon={RotateCcw}
        title="Autorisations de reprise"
        subtitle="Les évaluations rouvertes cette année, et pour quel motif"
        kpis={kpis}
        actions={
          <button type="button" className={heroAccentBtn} onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Délivrer un billet
          </button>
        }
      />

      <DirectoryFiltersBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher un élève..."
      />

      <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {TRIMESTER_FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => changeTrimester(filter.key)}
            aria-pressed={trimester === filter.key}
            className={cn(
              "h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors sm:h-9",
              trimester === filter.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : error ? (
        <DataError
          message="Les autorisations de reprise n'ont pas pu être chargées."
          error={error as Error}
          onRetry={() => void refetch()}
        />
      ) : items.length === 0 ? (
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <RotateCcw className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
            <p className="text-sm font-medium">Aucun billet délivré sur cette période</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Un billet ne s&apos;établit que sur une évaluation cochée « absent » par
              l&apos;enseignant sur sa feuille de notes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <RetakesList
            items={items}
            onDownload={handleDownload}
            downloadingId={downloadingId}
          />
          <RegisterFooter
            total={total}
            charges={items.length}
            scrollInfini={scrollInfini}
            noun="billet"
          />
        </div>
      )}

      <RetakeCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
