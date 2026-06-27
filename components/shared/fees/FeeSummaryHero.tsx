import { cn } from "@/lib/utils"

/**
 * Bandeau de synthèse des frais aux couleurs KLASSCI : panneau bleu marque
 * (primary), chiffres en blanc, « Reste à payer » mis en avant en orange
 * (accent). Compatible thème clair et sombre (tokens primary/-foreground).
 *
 * Cas « rien à payer » (total attendu = 0) : neutralisé en blanc/gris pour ne
 * pas afficher un faux signal positif (cf. rule not-enrolled-empty-state).
 */
interface FeeSummaryHeroProps {
  totalExpected: number
  totalPaid: number
  totalRemaining: number
  className?: string
}

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`

export function FeeSummaryHero({
  totalExpected,
  totalPaid,
  totalRemaining,
  className,
}: FeeSummaryHeroProps) {
  const hasExpected = totalExpected > 0
  const pct = hasExpected ? Math.min(100, Math.round((totalPaid / totalExpected) * 100)) : 0
  const settled = hasExpected && totalRemaining <= 0

  return (
    <section
      aria-label="Résumé des frais"
      className={cn(
        "rounded-2xl bg-[linear-gradient(135deg,#0a3d8f_0%,#0453cb_42%,#2a69cb_56%,#f5821f_92%)] p-5 text-primary-foreground shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-primary-foreground/70">
            Total attendu
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums sm:text-3xl">
            {hasExpected ? fmt(totalExpected) : "—"}
          </p>
        </div>
        {hasExpected && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
              settled ? "bg-emerald-400/20 text-emerald-100" : "bg-accent/25 text-amber-100",
            )}
          >
            {settled ? "Soldé" : `${pct}% payé`}
          </span>
        )}
      </div>

      {/* Progression — piste blanche translucide, remplissage vert (montant payé) */}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-foreground/15">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-primary-foreground/10 p-3">
          <p className="text-[11px] uppercase tracking-wide text-primary-foreground/70">Payé</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-300">{fmt(totalPaid)}</p>
        </div>
        <div className="rounded-xl bg-primary-foreground/10 p-3">
          <p className="text-[11px] uppercase tracking-wide text-primary-foreground/70">
            Reste à payer
          </p>
          <p
            className={cn(
              "mt-0.5 text-lg font-bold tabular-nums",
              !hasExpected
                ? "text-primary-foreground/80"
                : settled
                  ? "text-emerald-200"
                  : "text-white",
            )}
          >
            {hasExpected ? fmt(totalRemaining) : "—"}
          </p>
        </div>
      </div>
    </section>
  )
}
