"use client"

import Link from "next/link"
import type { Route } from "next"
import { ClipboardList, Cloud, CloudOff, ListChecks, Mic, Sigma } from "lucide-react"
import { PageHero, heroAccentBtn } from "@/components/shared/PageHero"

/** Métadonnées d'évaluation utilisées par le hero (structural, découplé du contrat). */
interface EvaluationMeta {
  type: string
  subject_name: string
  class_name: string
  trimester: number
  title: string
  coefficient: number
  date: string
}

interface GradeEntryHeroProps {
  evaluation: EvaluationMeta
  gradedCount: number
  totalCount: number
  classAverage: number | null
  dirtyCount: number
  lastSaved: Date | null
  /** Lien « Mode dictée » (portail-aware). Affiché seulement si fourni. */
  dicteeHref?: string
}

/**
 * En-tête premium bi-marque (bleu -> orange) de la saisie des notes. Reprend
 * la signature `PageHero` : métadonnées de l'éval en sous-titre, KPIs verre
 * intégrés, et « Mode dictée » en CTA orange focal.
 */
export function GradeEntryHero({
  evaluation,
  gradedCount,
  totalCount,
  classAverage,
  dirtyCount,
  lastSaved,
  dicteeHref,
}: GradeEntryHeroProps) {
  const dateLabel = new Date(evaluation.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const statutValue =
    dirtyCount > 0
      ? `${dirtyCount} non sauvé${dirtyCount > 1 ? "s" : ""}`
      : lastSaved
        ? "Synchronisé"
        : "Prêt"

  return (
    <PageHero
      icon={ClipboardList}
      title={evaluation.title}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">
            {evaluation.type}
          </span>
          <span>{evaluation.subject_name}</span>
          <span className="text-white/40">·</span>
          <span>{evaluation.class_name}</span>
          <span className="text-white/40">·</span>
          <span>Trimestre {evaluation.trimester}</span>
          <span className="text-white/40">·</span>
          <span>Coef. {evaluation.coefficient}</span>
          <span className="text-white/40">·</span>
          <span>{dateLabel}</span>
        </span>
      }
      actions={
        dicteeHref ? (
          <Link href={dicteeHref as Route} className={heroAccentBtn}>
            <Mic className="h-4 w-4" />
            Mode dictée
          </Link>
        ) : undefined
      }
      kpis={[
        {
          label: "Saisies",
          value: `${gradedCount}/${totalCount}`,
          icon: ListChecks,
        },
        {
          label: "Moyenne classe",
          value: classAverage !== null ? classAverage.toFixed(2) : "—",
          icon: Sigma,
        },
        {
          label: "Statut",
          value: statutValue,
          icon: dirtyCount > 0 ? CloudOff : Cloud,
        },
      ]}
    />
  )
}
