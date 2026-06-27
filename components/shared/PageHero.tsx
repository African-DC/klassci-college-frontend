import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Hero signature KLASSCI : bandeau au dégradé bleu de marque (3 bleus :
 * #0a3d8f -> #0453cb -> #3b7ddb), titre + icône en blanc, et KPIs intégrés
 * en cartes blanches semi-transparentes (monochrome — pas de couleur par KPI,
 * cf. rule premium-redesign). Réservé aux pages listing/dashboard.
 *
 * Identique en thème clair et sombre (c'est un bandeau coloré à texte blanc).
 */
export interface HeroKpi {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  hint?: React.ReactNode
}

interface PageHeroProps {
  icon?: LucideIcon
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  kpis?: HeroKpi[]
  className?: string
}

export function PageHero({ icon: Icon, title, subtitle, actions, kpis, className }: PageHeroProps) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-gradient-to-br from-[#0a3d8f] via-[#0453cb] to-[#3b7ddb] p-5 text-white shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
              <Icon aria-hidden="true" className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-serif text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
            {subtitle && <div className="mt-0.5 text-sm text-white/70">{subtitle}</div>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {kpis && kpis.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k, i) => {
            const KIcon = k.icon
            return (
              <div
                key={i}
                className="rounded-xl border border-white/15 bg-white/10 p-3"
                role="group"
                aria-label={typeof k.value === "string" || typeof k.value === "number" ? `${k.label} : ${k.value}` : k.label}
              >
                <div className="flex items-center gap-2.5">
                  {KIcon && (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                      <KIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="text-xl font-bold leading-tight tracking-tight tabular-nums">
                      {k.value}
                    </div>
                    <p className="truncate text-[11px] text-white/65">{k.label}</p>
                  </div>
                </div>
                {k.hint && <div className="mt-1.5 text-[11px] text-white/60">{k.hint}</div>}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

/** Bouton blanc plein pour action principale dans le hero (texte bleu). */
export const heroPrimaryBtn =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-3.5 text-sm font-semibold text-[#0453cb] shadow-sm transition-colors hover:bg-white/90"

/** Bouton verre pour action secondaire dans le hero (texte blanc). */
export const heroGlassBtn =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/15 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/25"
