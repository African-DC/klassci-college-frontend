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
        // Dégradé bi-marque KLASSCI : bleu (titre, à gauche) -> orange du logo
        // (à droite). Les deux couleurs de la marque dans le fond du hero.
        "rounded-2xl bg-[linear-gradient(135deg,#0a3d8f_0%,#0453cb_42%,#2a69cb_56%,#f5821f_92%)] p-5 text-white shadow-sm sm:p-6",
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
        <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {kpis.map((k, i) => {
            const KIcon = k.icon
            return (
              <div
                key={i}
                className="rounded-xl border border-white/20 bg-white/15 px-3 py-2.5 backdrop-blur-sm"
                role="group"
                aria-label={typeof k.value === "string" || typeof k.value === "number" ? `${k.label} : ${k.value}` : k.label}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[11px] font-medium uppercase tracking-wide text-white/65">
                    {k.label}
                  </p>
                  {KIcon && <KIcon className="h-4 w-4 shrink-0 text-white/70" aria-hidden="true" />}
                </div>
                <div className="mt-1 text-2xl font-bold leading-none tracking-tight tabular-nums">
                  {k.value}
                </div>
                {k.hint && <div className="mt-1 truncate text-[11px] text-white/60">{k.hint}</div>}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

/**
 * Titre de sous-section (couche 4) avec la petite icône carrée au dégradé bleu
 * KLASSCI. Cohérence du header de page jusqu'aux sous-blocs.
 */
export function SectionTitle({
  icon: Icon,
  children,
  className,
}: {
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {Icon && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#f5821f] to-[#f9a826] text-white shadow-sm">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
      <h2 className="text-sm font-semibold tracking-tight">{children}</h2>
    </div>
  )
}

/** Bouton ORANGE plein — l'action focale du hero (accent KLASSCI). */
export const heroAccentBtn =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"

/** Bouton blanc plein pour action principale alternative dans le hero (texte bleu). */
export const heroPrimaryBtn =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-3.5 text-sm font-semibold text-[#0453cb] shadow-sm transition-colors hover:bg-white/90"

/** Bouton verre pour action secondaire dans le hero (texte blanc). */
export const heroGlassBtn =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/15 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/25"

/**
 * Hover premium pour les cartes (couches 2-3) : léger soulèvement + ombre bleue
 * KLASSCI. À composer avec une carte shadcn cliquable/survolable.
 */
export const premiumCardHover =
  "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_rgba(4,83,203,0.35)]"
