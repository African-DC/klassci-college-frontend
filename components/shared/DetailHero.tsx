"use client"

import { ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { HeroKpi } from "@/components/shared/PageHero"

/**
 * Hero premium unifié pour les fiches détail (parent, personnel, et à terme
 * élève/enseignant). Même dégradé bleu→orange que `PageHero`, mais avec avatar
 * (photo 404-safe), bouton retour, actions de contact et une bande de KPIs.
 * Un seul bloc sombre en tête qui porte toute la synthèse.
 */
interface DetailHeroProps {
  onBack?: () => void
  backLabel?: string
  photoUrl?: string | null
  initials: string
  name: string
  subtitle?: React.ReactNode
  badge?: React.ReactNode
  contact?: React.ReactNode
  kpis?: HeroKpi[]
  actions?: React.ReactNode
  onAvatarClick?: () => void
  onPhotoStatus?: (loaded: boolean) => void
}

export function DetailHero({
  onBack,
  backLabel = "Retour",
  photoUrl,
  initials,
  name,
  subtitle,
  badge,
  contact,
  kpis,
  actions,
  onAvatarClick,
  onPhotoStatus,
}: DetailHeroProps) {
  const avatar = (
    <Avatar className="h-16 w-16 rounded-2xl border-2 border-white/25 sm:h-20 sm:w-20">
      {photoUrl ? (
        <AvatarImage
          src={photoUrl}
          alt={name}
          className="object-cover"
          onLoadingStatusChange={(s) => onPhotoStatus?.(s === "loaded")}
        />
      ) : null}
      <AvatarFallback className="rounded-2xl bg-white/15 text-lg font-semibold text-white sm:text-xl">
        {initials}
      </AvatarFallback>
    </Avatar>
  )

  return (
    <section className="rounded-2xl bg-[linear-gradient(135deg,#0a3d8f_0%,#0453cb_42%,#2a69cb_56%,#f5821f_92%)] p-5 text-white shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10 transition-colors hover:bg-white/20"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </button>
        )}

        {onAvatarClick ? (
          <button
            type="button"
            onClick={onAvatarClick}
            aria-label="Voir la photo"
            className="shrink-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            {avatar}
          </button>
        ) : (
          <div className="shrink-0">{avatar}</div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-xl font-bold tracking-tight sm:text-2xl">{name}</h1>
            {badge}
          </div>
          {subtitle && <div className="mt-0.5 text-sm text-white/75">{subtitle}</div>}
          {contact && <div className="mt-3">{contact}</div>}
        </div>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {kpis && kpis.length > 0 && (
        <div
          className={cn(
            "mt-5 grid gap-2.5",
            kpis.length >= 3 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2",
          )}
        >
          {kpis.map((k, i) => {
            const KIcon = k.icon
            return (
              <div
                key={i}
                className="rounded-xl border border-white/20 bg-white/15 px-3 py-2.5 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[11px] font-medium uppercase tracking-wide text-white/65">
                    {k.label}
                  </p>
                  {KIcon && <KIcon className="h-4 w-4 shrink-0 text-white/70" aria-hidden="true" />}
                </div>
                <div className="mt-1 text-xl font-bold leading-none tracking-tight tabular-nums sm:text-2xl">
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
