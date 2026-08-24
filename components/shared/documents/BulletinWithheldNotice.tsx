"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import type { Route } from "next"

interface BulletinWithheldNoticeProps {
  /** Phrase composée par le serveur : trimestre, montant en retard, marche à suivre. */
  reason: string | null
  /** Vers le relevé des notes, qui reste consultable. */
  gradesHref: Route
}

/**
 * Ce que voit une famille dont le bulletin est retenu pour impayé.
 *
 * Deux choses à dire, et une seule est évidente. La première est le motif :
 * sans lui, un bulletin grisé se lit comme une panne. La seconde est que les
 * notes, elles, restent accessibles — c'est le lien ci-dessous. Une famille
 * qui voit son bulletin barré et rien d'autre suppose que tout est bloqué, et
 * appelle le secrétariat.
 *
 * Le ton reste factuel. La famille en retard n'a pas besoin d'un message
 * accusateur en plus.
 */
export function BulletinWithheldNotice({ reason, gradesHref }: BulletinWithheldNoticeProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30"
    >
      <div className="flex items-start gap-2.5">
        <Lock
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300"
        />
        <div className="min-w-0 space-y-2">
          <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-100">
            {reason ?? "Bulletin indisponible : des échéances restent à régler. Rapprochez-vous du secrétariat."}
          </p>
          <Link
            href={gradesHref}
            className="inline-flex h-11 items-center text-xs font-semibold text-amber-900 underline underline-offset-4 hover:text-amber-950 dark:text-amber-100 dark:hover:text-amber-50"
          >
            Consulter les notes publiées
          </Link>
        </div>
      </div>
    </div>
  )
}
