"use client"

import { Lock } from "lucide-react"
import { formatFcfa } from "@/lib/utils/money"

interface DocumentLockNoticeProps {
  lateAmount: number
  /** Nom de l'élève, quand le lecteur peut en suivre plusieurs (portail parent). */
  studentName?: string
  /** L'utilisateur peut lever la retenue : le message change de ton. */
  canOverride?: boolean
}

/**
 * Cadenas affiché avant le clic quand des échéances arrivées à terme restent
 * dues.
 *
 * Le montant est toujours dit : « payez » sans chiffre n'aide personne à
 * préparer sa visite au secrétariat. Le ton reste factuel — la famille en
 * retard n'a pas besoin d'un message accusateur en plus.
 */
export function DocumentLockNotice({
  lateAmount,
  studentName,
  canOverride = false,
}: DocumentLockNoticeProps) {
  const subject = studentName ? `de ${studentName}` : "de cet élève"

  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <Lock aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Documents retenus {subject}
          </p>
          <p className="text-2xl font-bold tabular-nums text-amber-900 dark:text-amber-100">
            {formatFcfa(lateAmount)}
          </p>
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200/90">
            Ce montant correspond aux échéances déjà arrivées à terme et non
            réglées. Les échéances à venir ne sont pas comptées.{" "}
            {canOverride
              ? "Vous pouvez délivrer le document malgré la dette en indiquant un motif."
              : "Rendez-vous au secrétariat de l'école pour régulariser."}
          </p>
        </div>
      </div>
    </div>
  )
}
