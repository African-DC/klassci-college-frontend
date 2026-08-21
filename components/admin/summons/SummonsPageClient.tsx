"use client"

import { useState } from "react"
import { CalendarCheck2, CalendarX2, Clock, Megaphone, Plus, Users } from "lucide-react"
import { PageHero, heroAccentBtn, type HeroKpi } from "@/components/shared/PageHero"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useDownloadSummons, useSummonsRegister } from "@/lib/hooks/useSummons"
import { SummonsCreateModal } from "./SummonsCreateModal"
import { SummonsOutcomeModal } from "./SummonsOutcomeModal"
import { SummonsRegisterList } from "./SummonsRegisterList"
import type { ParentSummons } from "@/lib/contracts/school-life"

const OUTCOME_FILTERS = [
  { key: "", label: "Toutes" },
  { key: "pending", label: "Non renseignées" },
  { key: "attended", label: "Tuteur venu" },
  { key: "missed", label: "Tuteur absent" },
]

const TRIMESTER_FILTERS = [
  { key: 0, label: "Toute l'année" },
  { key: 1, label: "T1" },
  { key: 2, label: "T2" },
  { key: 3, label: "T3" },
]

export function SummonsPageClient() {
  const [outcome, setOutcome] = useState("")
  const [trimester, setTrimester] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [outcomeTarget, setOutcomeTarget] = useState<ParentSummons | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const { has, isLoading: loadingPermissions } = usePermissions()
  const canManage = has("documents:parent-summons")

  const filters = {
    ...(outcome ? { outcome } : {}),
    ...(trimester ? { trimester } : {}),
  }
  const { data, isLoading, error, refetch } = useSummonsRegister(filters, canManage)
  const { mutate: download } = useDownloadSummons()

  const items = data?.items ?? []
  const summary = data?.summary

  const kpis: HeroKpi[] = [
    { label: "Convocations", value: summary?.total ?? "—", icon: Users },
    { label: "Tuteur venu", value: summary?.attended ?? "—", icon: CalendarCheck2 },
    { label: "Tuteur absent", value: summary?.missed ?? "—", icon: CalendarX2 },
    { label: "Non renseignées", value: summary?.pending ?? "—", icon: Clock },
  ]

  function handleDownload(summons: ParentSummons) {
    setDownloadingId(summons.id)
    download(summons, { onSettled: () => setDownloadingId(null) })
  }

  if (!loadingPermissions && !canManage) {
    return (
      <div className="space-y-6">
        <PageHero
          icon={Megaphone}
          title="Convocations de parent"
          subtitle="Registre des tuteurs convoqués et de la suite donnée"
        />
        <DataError
          message="Vous n'avez pas le droit de consulter le registre des convocations."
          error={new Error("Permission denied: documents:parent-summons")}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHero
        icon={Megaphone}
        title="Convocations de parent"
        subtitle="Qui a été convoqué, quand, et qui est venu"
        kpis={kpis}
        actions={
          <button
            type="button"
            className={heroAccentBtn}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Convoquer un tuteur
          </button>
        }
      />

      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {OUTCOME_FILTERS.map((filter) => (
            <button
              key={filter.key || "all"}
              type="button"
              onClick={() => setOutcome(filter.key)}
              aria-pressed={outcome === filter.key}
              className={cn(
                "h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors sm:h-9",
                outcome === filter.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {TRIMESTER_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setTrimester(filter.key)}
              aria-pressed={trimester === filter.key}
              className={cn(
                "h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors sm:h-9",
                trimester === filter.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : error ? (
        <DataError
          message="Le registre des convocations n'a pas pu être chargé."
          error={error as Error}
          onRetry={() => void refetch()}
        />
      ) : items.length === 0 ? (
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
            <p className="text-sm font-medium">Aucune convocation dans ce filtre</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Convoquez un tuteur depuis le bouton en haut de page : la convocation s&apos;inscrit
              ici, et son PDF se remet à la famille.
            </p>
          </CardContent>
        </Card>
      ) : (
        <SummonsRegisterList
          items={items}
          onRecordOutcome={setOutcomeTarget}
          onDownload={handleDownload}
          downloadingId={downloadingId}
        />
      )}

      <SummonsCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <SummonsOutcomeModal summons={outcomeTarget} onClose={() => setOutcomeTarget(null)} />
    </div>
  )
}
